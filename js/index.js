import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, getDocs, doc, addDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy, where, limit } from "firebase/firestore";
import $ from "jquery";
import Swal from 'sweetalert2';
import autocomplete from 'autocompleter';
import 'bootstrap';
import '../css/style.css';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjZVV5K-XdKVyYxmi-l9c2e866WoL8PV0",
  authDomain: "enc-test-project2022.firebaseapp.com",
  projectId: "enc-test-project2022",
  storageBucket: "enc-test-project2022.appspot.com",
  messagingSenderId: "795218609813",
  appId: "1:795218609813:web:e8b0ff8606d4073c7e3d9c",
  measurementId: "G-25X1LW08GQ"
};

// --------------- Initialize Firebase --------------- //

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// --------------- Manage User --------------- //

const auth = getAuth();
const provider =  new GoogleAuthProvider();

var url = window.location.pathname;
var filename = url.substring(url.lastIndexOf('/')+1);

onAuthStateChanged(auth, (_user) => {
  if (_user) {
    console.log("_user ==>", _user);
    // User is signed in
    if (filename === 'signin.html') {
      window.location.href = "index.html";
    } else {
      $(".user-email").text(_user.email);
    }
  } else {
    // User is signed out
    if (filename !== 'signin.html') {
      window.location.href = "signin.html";
    }
  }
});

// --------------- Authentication --------------- //

// Login
$("#login-form").on("submit", (event) => {

  event.preventDefault();

  const email =  $("input#email").val();
  const password = $("input#password").val();

  signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
    const user = userCredential.user;
    window.location.href = "index.html";
  }).catch((error) => {
    console.log("error ==>", error);
  });

});

// Login with Google
$("#google-btn").on("click", () => {
  signInWithPopup(auth, provider).then((res) => {
    window.location.href = "index.html";
  }).catch((error) => {
    console.log("error ==>", error);
  });
});

// Logout
$("#logout-btn").on("click", () => {
  signOut(auth).then(() => {
    window.location.href = "signin.html";
  }).catch((error) => {
    console.log("error ==>", error);
  });
});

// --------------- Image Upload --------------- //

var files = [];
var reader = new FileReader();
var fileName;

$("#file-upload").on("change", (event) => {
  files = event.target.files;
  fileName = `${GetFileName(files[0])} ${GetExtName(files[0])}`;
  $(".file-name").text(fileName);
  reader.readAsDataURL(files[0]);
});

$(reader).on("load", () => {
  $(".btn-block").hide();
  $(".img-block img").attr("src", reader.result);
});

function GetExtName(_file) {
  var temp = _file.name.split('.');
  var ext = temp.slice(temp.length-1, temp.length);
  return '.' + ext[0];
}

function GetFileName(_file) {
  var temp = _file.name.split('.');
  var fName = temp.slice(0, -1).join('.');
  return fName;
}

function uploadImage() {
  return new Promise(resolve => {

    var imgUpload = files[0];

    const metaData = { contentType: imgUpload.type }
    const storage = getStorage();
    const storageRef = sRef(storage, `images/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, imgUpload, metaData);

    uploadTask.on('state-changed', (snapshot) => {
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      $(".up-progress").text(`( Upload ${Math.round(progress)}% )`);  
    }, (error) => {
      console.log("error ==>", error);
      resolve(false);
    }, () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        resolve(downloadURL);
      });
    });

  });
}

// --------------- Create & Retrieve Data --------------- //

// Init Services
const db = getFirestore();

// Collection Ref
const menuRef = collection(db, 'menu-list');
const customerRef = collection(db, 'customer-list');
const userRef = collection(db, 'user-list');

// Insert Menu Data
$("#menu-add-form").on("submit", (event) => {

  event.preventDefault();

  if (files.length == 0) {
    warningAlert("Photo is required.");
    return;
  } 

  loading(1);

  uploadImage().then(_url => {
    console.log("name ==>", $("input#name").val());
    console.log("price ==>", $("input#price").val());
    console.log("photo ==>", _url);
    console.log("description ==>", $("input#description").val());

    addDoc(menuRef, {
      name: $("input#name").val(),
      price: parseInt($("input#price").val()),
      photo: _url,
      description: $("textarea#description").val(),
    }).then(() => {
      loading(0);
      successAlert('Success!', 'Data added successfully.');
      $("#menu-add-form").trigger("reset");
      $(".btn-block").show().next(".img-block").hide();
      $(".file-name").text("").next(".up-progress").text("");
      getMenuData("name", "desc");
    }).catch((error) => {
      loading(0);
      console.log("error ==>", error);
      failAlert('Error!', error); 
    });
  });

});

// Insert Menu Data
$("#customer-add-form").on("submit", (event) => {

  event.preventDefault();

  loading(1);

  console.log("name ==>", $("input#name").val());
  console.log("phone ==>", $("input#phone").val());
  console.log("email ==>", $("input#email").val());
  console.log("city ==>", $("input#city").val());

  addDoc(customerRef, {
    name: $("input#name").val(),
    phone: $("input#phone").val(),
    email: $("input#email").val(),
    city: $("input#city").val(),
  }).then(() => {
    loading(0);
    successAlert('Success!', 'Data added successfully.');
    $("#customer-add-form").trigger("reset");
    getCustomerData("name", "desc");
  }).catch((error) => {
    loading(0);
    console.log("error ==>", error);
    failAlert('Error!', error);
  });

});

// Retrieve Menu Data
function getMenuData(_orderBy, _orderAs, _keyword) {

  console.log("_orderBy ==>", _orderBy);
  console.log("_orderAs ==>", _orderAs);
  console.log("_keyword ==>", _keyword);

  var menus = [];
  var menuArr = [];

  const q = _keyword ? query(menuRef, where("name", "==", _keyword)) : query(menuRef, orderBy(_orderBy, _orderAs));
  
  getDocs(q).then((snapshot) => {
    snapshot.docs.forEach((doc) => {

      menus.push({ ...doc.data(), id: doc.id });
      menuArr.push({ label: doc.data().name, value: doc.data().name });

      // Add data into table
      $('#menu-table tbody tr').remove();
      if (menus.length > 0) {
        menus.forEach(elem => {
          var row = `<tr>
            <td><img class="img-thumbnail" style="width: 100px;" src="${elem.photo}"></td>
            <td>${elem.name}</td>
            <td>${elem.price}</td>
            <td>${elem.description}</td>
          </tr>`;
          $('#menu-table').append(row);
        });
      }

      // Init Data for Autocomplete
      if (menuArr.length > 0) {
        autocomplete({
          minLength: 1,
          input: document.getElementById("search-input"),
          fetch: function(text, update) {
              text = text.toLowerCase();
              var suggestions = menuArr.filter(n => n.label.toLowerCase().startsWith(text))
              update(suggestions);
          },
          onSelect: function(item) {
            $("#search-input").val(item.value);
          }
        });
      }

    });
  }).catch((error) => {
    console.log("error ==>", error);
  });
   
}

// Retrieve Customer Data
function getCustomerData(_orderBy, _orderAs) {

  var datas = [];

  const q = query(customerRef, orderBy(_orderBy, _orderAs));
  
  getDocs(q).then((snapshot) => {
    snapshot.docs.forEach((doc) => {

      datas.push({ ...doc.data(), id: doc.id });

      // Add data into table
      $('#customer-table tbody tr').remove();
      if (datas.length > 0) {
        datas.forEach(elem => {
          var row = `<tr>
            <td>${elem.name}</td>
            <td>${elem.phone}</td>
            <td>${elem.email}</td>
            <td>${elem.city}</td>
          </tr>`;
          $('#customer-table').append(row);
        });
      }

    });
  }).catch((error) => {
    console.log("error ==>", error);
  });

}

// Sort Data
$(".sort-col").on("click", (event) => {

  let _orderBy = $(event.currentTarget).attr("orderBy");
  let _orderAs = $(event.currentTarget).attr("orderAs") === "desc" ? "asc" : "desc";

  if (_orderBy === "name") {
    if (_orderAs === "asc") $(event.currentTarget).html("Name <i class='bi bi-caret-up-fill'></i>");
    else $(event.currentTarget).html("Name <i class='bi bi-caret-down-fill'></i>");
    $("span[orderBy=price]").children("i").remove();
  } else {
    if (_orderAs === "asc") $(event.currentTarget).html("Price <i class='bi bi-caret-up-fill'></i>");
    else $(event.currentTarget).html("Price <i class='bi bi-caret-down-fill'></i>");
    $("span[orderBy=name]").children("i").remove();
  }

  $("#search-input").val("");
  $(event.currentTarget).attr("orderAs", _orderAs);

  getMenuData(_orderBy, _orderAs);

});

// Search Data
$("#menu-search-form").on("submit", (event) => {

  event.preventDefault();

  var _keyword = $("#search-input").val();
  getMenuData("name", "desc", _keyword);
});

// --------------- Init Data --------------- //

if (filename === "menu.html") getMenuData("name", "desc");
else if (filename === "customer.html") getCustomerData("name", "desc");

// --------------- Common Functions --------------- //

function successAlert(_title, _msg) {
  const Toast = Swal.mixin({
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 5000,
      background: "#33b97c",
      allowOutsideClick: false,
      animation: false
  });
  Toast.fire({
      html: `
      <div class="my-alert success text-left">
          <i class="my-alert-icn fas fa-check-circle"></i>
          <p class="my-alert-tit">${_title}</p>
          <p class="my-alert-msg">${_msg}</p>
      </div>
      `
  });
}

function failAlert(_msg) {
  const Toast = Swal.mixin({
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 5000,
      background: "#f1534a",
      animation: false
  });
  Toast.fire({
      html: `
      <div class="my-alert error text-left">
          <i class="my-alert-icn fas fa-times-circle"></i>
          <p class="my-alert-tit">Error</p>
          <p class="my-alert-msg">${_msg}</p>
      </div>
      `
  });
}

function warningAlert(_msg) {
  const Toast = Swal.mixin({
      toast: true,
      position: "bottom-end",
      showConfirmButton: false,
      timer: 5000,
      background: "#de8321",
      animation: false,
      customClass: "animate__animated animate__fadeInRight"
  });
  Toast.fire({
      html: `
      <div class="my-alert warning text-left">
          <i class="my-alert-icn fas fa-exclamation-circle"></i>
          <p class="my-alert-tit">Warning</p>
          <p class="my-alert-msg">${_msg}</p>
      </div>
      `
  });
} 

function loading(input) {
  if (input === 1) $('#my-loading').show();
  else $('#my-loading').hide();
}
