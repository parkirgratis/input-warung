import { map } from "./config/peta.js";
// import {onClosePopupClick,onDeleteMarkerClick,onMapClick,onMapPointerMove,disposePopover} from './controller/popup.js';
import {
  onClick,
  setValue,
} from "https://cdn.jsdelivr.net/gh/jscroot/element@0.1.7/croot.js";
import { createMarker } from "./controller/marker.js";
import { fromLonLat, toLonLat } from "https://cdn.skypack.dev/ol/proj.js";
import {
  setInner,
  show,
  hide,
  getValue,
  getFileSize,
} from "https://cdn.jsdelivr.net/gh/jscroot/element@0.0.6/croot.js";
import { postFile } from "https://cdn.jsdelivr.net/gh/jscroot/api@0.0.2/croot.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/src/sweetalert2.js";
import { addCSS } from "https://cdn.jsdelivr.net/gh/jscroot/lib@0.0.9/element.js";

addCSS("https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.css");

let currentMarker;

function enableSwipeUp(element) {
  let startY,
    currentY,
    isDragging = false;

  element.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
  });

  element.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const translateY = Math.max(0, currentY - startY);
    element.style.transform = `translateY(${translateY}px)`;
  });

  element.addEventListener("touchend", () => {
    isDragging = false;
    if (currentY - startY < -50) {
      element.classList.add("active");
    } else {
      element.style.transform = "translateY(50%)";
    }
  });
}

function enableSwipeDownToHide(element) {
  let startY,
    currentY,
    isDragging = false,
    swipeCount = 0;

  element.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
  });

  element.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const translateY = Math.max(0, currentY - startY);
    element.style.transform = `translateY(${translateY}px)`;
  });

  element.addEventListener("touchend", () => {
    isDragging = false;
    const isAtTop = element.scrollTop === 0; // Cek apakah sudah di bagian atas

    if (currentY - startY > 50 && isAtTop) {
      // Hanya izinkan swipe down jika di bagian atas
      swipeCount++;
      if (swipeCount >= 2) {
        element.style.display = "none";
        swipeCount = 0; // Reset swipe count
      }
    } else {
      element.style.transform = "translateY(0)";
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("sidebar");
  const dataSidebar = document.getElementById("dataSidebar");
  const dataPopup = document.getElementById("dataPopup");
  // const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navbarMenu = document.querySelector(".navbar-menu");

  map.getTargetElement().addEventListener("click", function () {
    sidebar.classList.toggle("active");
    dataSidebar.style.display = "none";
  });

  // mobileMenuToggle.addEventListener('click', function() {
  //     navbarMenu.classList.toggle('active');
  // });

  // Pastikan sidebar tidak menutup ketika diklik
  sidebar.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  // Tambahkan event listener untuk menangkap klik pada peta
  map.on("click", function (evt) {
    const tile = evt.coordinate;
    const coordinate = toLonLat(tile);

    if (currentMarker) {
      map.removeLayer(currentMarker);
    }

    const marker = new ol.Feature({
      geometry: new ol.geom.Point(tile),
    });

    marker.setStyle(
      new ol.style.Style({
        image: new ol.style.Icon({
          src: "https://static.vecteezy.com/system/resources/thumbnails/044/280/373/small/graphics-large-blue-pin-png.png",
          scale: 0.2,
        }),
      })
    );

    const vectorSource = new ol.source.Vector({
      features: [marker],
    });

    currentMarker = new ol.layer.Vector({
      source: vectorSource,
    });

    map.addLayer(currentMarker);

    setValue("long", coordinate[0]);
    setValue("lat", coordinate[1]);

    console.log("Coordinates saved:", coordinate);
  });

  document
    .getElementById("insertmarkerbutton")
    .addEventListener("click", function () {
      console.log("Tombol insertmarkerbutton ditekan");
      uploadImage(); // Memanggil fungsi uploadImage

      const lat = parseFloat(document.getElementById("lat").value);
      const lon = parseFloat(document.getElementById("long").value);

      // Mengambil data dari input di sidebar
      const placeName = document.getElementById("namatempat").value;
      const location = document.getElementById("lokasi").value;
      const opentime = document.getElementById("jam_buka").value;
      const paymethod = Array.from(
          document.querySelectorAll('input[name="metodebayar"]:checked')
      ).map((checkbox) => checkbox.value);
      const imageInput = document.getElementById("uploadImage");

      if (!captchaVerified) {
        Swal.fire({
          icon: "warning",
          title: "Verifikasi Captcha Gagal",
          text: "Silakan verifikasi ulang captcha terlebih dahulu!",
        });
        return;
      }

      if (imageInput.files.length > 0) {
        const image = imageInput.files[0].name; // Mengambil hanya nama file

        // Membuat objek untuk dikirim sebagai JSON
        const data = {
          nama_tempat: placeName,
          lokasi: location,
          jam_buka: opentime,
          metode_pembayaran: paymethod,
          lat: lat,
          lon: lon,
          gambar: image,
        };

        console.log("Data yang akan dikirim:", data); // Tambahkan log untuk melihat data yang akan dikirim

        // Mengirim data ke server menggunakan fetch dengan body berformat JSON
        fetch(
          "https://asia-southeast2-awangga.cloudfunctions.net/parkirgratis/data/tempat-warung",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Data dan koordinat berhasil disimpan!",
              });
              // Menambahkan koordinat ke database
              tambahKoordinatKeDatabase(lon, lat);
            }
          })
          .catch((error) => {
            console.error("Error:", error);
          });

        // Prepare coordinates data for koordinat endpoint
        const coordData = {
          markers: [[lon, lat]],
        };

        fetch(
          "https://asia-southeast2-awangga.cloudfunctions.net/parkirgratis/data/marker-warung",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(coordData),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            Swal.fire({
              icon: "success",
              title: "Berhasil",
              text: "Data dan Koordinat berhasil ditambahkan!",
            });
          })
          .catch((error) => {
            console.error("Error:", error);
            Swal.fire({
              icon: "error",
              title: "Kesalahan",
              text: "Gagal menambahkan tempat atau menyimpan koordinat!",
            });
          });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Silakan pilih file gambar terlebih dahulu",
        });
      }
    });

  const showDataButton = document.getElementById("showDataButton");
  const closeDataSidebar = document.getElementById("closeDataSidebar");
  const dataSidebarContent = document.getElementById("dataSidebar-content");

  showDataButton.addEventListener("click", function (event) {
    event.preventDefault();
    console.log("Tombol TAMPILKAN DATA ditekan");
    dataSidebar.style.display = "block";

    if (window.innerWidth <= 768) {
      navbarMenu.classList.remove("active");
    }
  });

  closeDataSidebar.addEventListener("click", function () {
    console.log("Tombol Kembali ditekan");
    dataSidebar.style.display = "none";
  });

  function fetchDataAndRender() {
    fetch(
      "https://asia-southeast2-awangga.cloudfunctions.net/parkirgratis/data/lokasi"
    )
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("Data lokasi bukan array:", data);
          return;
        }

        // Dapatkan lokasi pengguna dan urutkan data berdasarkan jarak
        getUserLocation(
          (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            const sortedData = sortDataByProximity(data, userLat, userLon);
            renderDataToSidebar(sortedData);
          },
          () => {
            // Jika gagal mendapatkan lokasi, tetap render data tanpa pengurutan
            renderDataToSidebar(data);
          }
        );
      })
      .catch((error) => console.error("Gagal mengambil data lokasi:", error));
  }

  function renderDataToSidebar(lokasiData) {
    dataSidebarContent.innerHTML = ""; // Kosongkan konten sebelumnya
    lokasiData.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className =
        "lokasi-item flex items-center gap-2 p-2 border-b";

      itemElement.innerHTML = `
                <img src="${item.gambar || "default.jpg"}" alt="${
        item.nama_tempat || "Nama Tempat"
      }" class="w-16 h-16 object-cover rounded">
                <div>
                    <h3 class="font-semibold">${
                      item.nama_tempat || "Nama Tempat"
                    }</h3>
                    <p>${item.lokasi || "Lokasi"}</p>
                    <p>${item.fasilitas || "Fasilitas"}</p>
                </div>
                
            `;

      itemElement.addEventListener("click", () => {
        focusOnMarker(item.lon, item.lat);
        showDataPopup(item);
      });

      dataSidebarContent.appendChild(itemElement);
    });
  }

  function showDataPopup(item) {
    const dataPopup = document.getElementById("dataPopup");
    const dataPopupContent = document.getElementById("dataPopup-content");

    dataPopupContent.innerHTML = `
            <h3 class="text-lg font-bold mb-2">${item.nama_tempat}</h3>
            <p class="text-sm text-gray-600 mb-1">Lokasi: ${item.lokasi}</p>
            <p class="text-sm text-gray-600 mb-3">Fasilitas: ${
              item.fasilitas
            }</p>
            <img src="${item.gambar || "default.jpg"}" alt="${
      item.nama_tempat
    }" class="w-full h-auto rounded mb-3">
            <!-- <button id="closeDataPopup" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Tutup</button> -->
        `;

    dataPopup.classList.add("active");
  }

  // document.getElementById('closeDataPopup').addEventListener('click', function() {
  //     const dataPopup = document.getElementById('dataPopup');
  //     dataPopup.classList.remove('active');
  // });

  function focusOnMarker(long, lat) {
    const view = map.getView();
    const coordinate = fromLonLat([long, lat]);
    view.animate({
      center: coordinate,
      duration: 1000,
      zoom: 18,
    });
  }

  // Panggil fungsi untuk mengambil dan menampilkan data
  fetchDataAndRender();

  if (sidebar) enableSwipeUp(sidebar);
  if (dataSidebar) enableSwipeUp(dataSidebar);
  if (dataPopup) enableSwipeUp(dataPopup);
  if (sidebar) enableSwipeDownToHide(sidebar);
  if (dataSidebar) enableSwipeDownToHide(dataSidebar);
  if (dataPopup) enableSwipeDownToHide(dataPopup);
});

// onClick('popup-closer',onClosePopupClick);
// onClick('insertmarkerbutton',onSubmitMarkerClick);
// onClick('hapusbutton',onDeleteMarkerClick);

// map.on('click', onMapClick);
// map.on('pointermove', onMapPointerMove);
// map.on('movestart', disposePopover);

fetch(
  "https://asia-southeast2-awangga.cloudfunctions.net/parkirgratis/data/marker"
)
  .then((response) => response.json())
  .then((data) => {
    if (!Array.isArray(data.markers)) {
      console.error("Data marker bukan array:", data);
      return;
    }
    console.log("Koordinat Marker:", data.markers);
    createMapMarkers(data.markers);
  })
  .catch((error) => console.error("Gagal mengambil data marker:", error));

function createMapMarkers(markerCoords) {
  const markers = markerCoords.map((coord) => createMarker(map, coord));

  markers.forEach((marker, index) => {});
}

// document.getElementById('showFormButton').addEventListener('click', function() {
//     const form = document.getElementById('placeForm');
//     if (form.style.display === 'block') {
//         form.style.display = 'none';
//     } else {
//         form.style.display = 'block';
//     }
// });

// const imageInput = document.getElementById('uploadImage');
// console.log(imageInput.files);

window.uploadImage = uploadImage;

const target_url =
  "https://asia-southeast2-awangga.cloudfunctions.net/parkirgratis/upload/img";

function uploadImage() {
  const imageInput = document.getElementById("uploadImage");
  if (!imageInput || imageInput.files.length === 0) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Silakan pilih file gambar terlebih dahulu",
    });
    return;
  }
  const inputFileElement = document.getElementById("uploadImage");
  if (inputFileElement) {
    hide("uploadImage");
  } else {
    console.error("Element with ID 'uploadImage' not found");
  }
  let besar = getFileSize("uploadImage");
  setInner("isi", besar);

  postFile(target_url, "uploadImage", "img", renderToHtml);
}

// Fungsi untuk menangani respons unggahan
function renderToHtml(result) {
  console.log(result);
  setInner(
    "isi",
    "https://parkirgratis.github.io/filegambar/" + result.response
  );
  show("uploadImage");
}

// // Fungsi untuk menangani kesalahan unggahan
// function handleUploadError(error) {
//     console.error(error);
//     if (error.status === 409) {
//         alert("File already exists or there is a conflict. Please try again with a different file.");
//     } else {
//         alert("An error occurred during the upload. Please try again.");
//     }
//     show("uploadImage");
// }
// ;

document.getElementById("dataSidebar").style.display = "none";

function getUserLocation(successCallback, errorCallback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successCallback, (error) => {
      console.error("Gagal mendapatkan lokasi pengguna:", error);
      if (errorCallback) errorCallback();
    });
  } else {
    console.error("Geolokasi tidak didukung oleh browser ini.");
    if (errorCallback) errorCallback();
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    0.5 -
    Math.cos(dLat) / 2 +
    (Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      (1 - Math.cos(dLon))) /
      2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

function sortDataByProximity(data, userLat, userLon) {
  return data.sort((a, b) => {
    const distanceA = calculateDistance(userLat, userLon, a.lat, a.lon);
    const distanceB = calculateDistance(userLat, userLon, b.lat, b.lon);
    return distanceA - distanceB;
  });
}

function myFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}

window.onclick = function (event) {
  if (!event.target.matches(".dropbtn")) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};
