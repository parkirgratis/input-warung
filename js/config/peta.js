import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import XYZ from 'https://cdn.skypack.dev/ol/source/XYZ.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import {fromLonLat} from 'https://cdn.skypack.dev/ol/proj.js';
import Overlay from 'https://cdn.skypack.dev/ol/Overlay.js';
import {container} from 'https://cdn.jsdelivr.net/gh/jscroot/element@0.1.7/croot.js';
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/src/sweetalert2.js";
import { addCSS } from "https://cdn.jsdelivr.net/gh/jscroot/lib@0.0.9/element.js";

addCSS("https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.css");


const attributions = '<a href="https://petapedia.github.io/" target="_blank">&copy; PetaPedia Indonesia</a> ';

const place = [107.6098, -6.9175];

export let idmarker = {id:1};

const basemap = new TileLayer({
  source: new OSM({attributions: attributions,}),
});

const defaultstartmap = new View({
  center: fromLonLat(place),
  zoom: 12,
});

export const overlay = new Overlay({
    element: container('popup'),
    autoPan: {
      animation: {
        duration: 250,
      },
    },
  });

export const popupinfo = new Overlay({
    element: container('popupinfo'),
    autoPan: {
      animation: {
        duration: 250,
      },
    },
});

export let map = new Map({
  overlays: [overlay, popupinfo],
  target: 'map',
  layers: [basemap],
  view: defaultstartmap,
});

document.getElementById('closeSidebar').addEventListener('click', function() {
  document.getElementById('sidebar').style.display = 'none';
});

// Tambahkan event listener untuk menampilkan sidebar ketika peta diklik
map.on('click', function() {
  document.getElementById('sidebar').style.display = 'block';
});

// Fungsi untuk memusatkan peta pada lokasi pengguna
function centerMapOnUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoordinates = [position.coords.longitude, position.coords.latitude];
        const view = map.getView();
        view.setCenter(fromLonLat(userCoordinates));
        view.setZoom(17);

        // Tambahkan logika untuk menampilkan pesan izin
        Swal.fire({
          icon: "success",
          title: "Terima Kasih",
          text: "Lokasi Anda telah kami dapatkan. Semoga harimu selalu menyenangkan!"
        });
      },
      (error) => {
        console.error('Error mendapatkan lokasi pengguna:', error);

        // Tambahkan logika untuk menampilkan pesan kesalahan
        Swal.fire({
          icon: "error",
          title: "Gagal Mendapatkan Lokasi",
          text: "Tidak dapat mengakses lokasi Anda. Pastikan izin lokasi diaktifkan."
        });
      }
    );
  } else {
    Swal.fire({
      icon: "error",
      title: "Geolocation Tidak Didukung",
      text: "Geolocation tidak didukung oleh browser ini."
    });
  }
}

// Panggil fungsi untuk memusatkan peta pada lokasi pengguna saat halaman dimuat
document.addEventListener('DOMContentLoaded', centerMapOnUserLocation);
