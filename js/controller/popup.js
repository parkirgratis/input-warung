import {toLonLat} from 'https://cdn.skypack.dev/ol/proj.js';
import {toStringHDMS} from 'https://cdn.skypack.dev/ol/coordinate.js';
import {overlay,map,popupinfo} from '../config/peta.js';
import {clickpopup} from '../template/popup.js';
import {textBlur,setValue} from 'https://cdn.jsdelivr.net/gh/jscroot/element@0.1.7/croot.js';
import {setInner,getValue} from "https://cdn.jsdelivr.net/gh/jscroot/element@0.0.6/croot.js";

export function onClosePopupClick() {
    overlay.setPosition(undefined);
    textBlur('popup-closer');
}

export function onDeleteMarkerClick() {
    let idmarker = getValue('idmarker');
    popupinfo.setPosition(undefined);
    deleteMarker(idmarker);
}

  export function onSubmitMarkerClick() {
  let long = parseFloat(getValue('long')); // Konversi ke float
  let lat = parseFloat(getValue('lat')); // Konversi ke float
  let namatempat = getValue('namatempat');
  let lokasi = getValue('lokasi');
  let fasilitas = getValue('fasilitas');
  let gambar = getValue('imageInput'); // Tambahkan gambar jika ada
  let data = { long, lat, namatempat, lokasi, fasilitas, gambar };

  if (!gambar) {
    alert("Please select an image file");
    return;
  }

  uploadImage(); // Panggil fungsi uploadImage untuk mengunggah gambar

  addToDatabase(namatempat, long, lat, lokasi, fasilitas, gambar); // Tambahkan data ke database

  tambahKoordinatKeDatabase(long, lat);

  overlay.setPosition(undefined);
  textBlur('popup-closer');
  insertMarker(namatempat, long, lat, lokasi, fasilitas);
  idmarker.id = idmarker.id + 1;
}

function popupInputMarker(evt) {
    let tile = evt.coordinate;
    let coordinate = toLonLat(tile);
    // let namatempat = getValue('namatempat');
    // let lokasi = getValue('lokasi');
    // let fasilitas = getValue('fasilitas');
    // // Hapus referensi ke volume
    // // let volume = getValue('volume');
    let msg = clickpopup.replace("#LONG#", coordinate[0])
                        .replace("#LAT#", coordinate[1])
                        .replace('#X#', tile[0])
                        .replace('#Y#', tile[1])
                        .replace('#HDMS#', toStringHDMS(coordinate));
    msg = 'ID : ' + idmarker.id + '<br>' + msg + "Pixel : " + evt.pixel + "<br>";
    setInner('popup-content', msg);
    setValue('long', coordinate[0]);
    setValue('lat', coordinate[1]);
    overlay.setPosition(tile);
}

function popupGetMarker(evt, feature) {
    let title = feature.get('id') + "#" + feature.get('namatempat');
    setInner('popupinfo-title', title);
    setValue('idmarker', feature.get('id'));
    let loka = "lokasi : " + feature.get('lokasi'); 
    let fasi = "fasilitas : " + feature.get('fasilitas') + "<br>" + feature.get('geometry').flatCoordinates;
    let content = loka + "<br>" + fasi;
    setInner('popupinfo-content', content);
    popupinfo.setPosition(evt.coordinate);
}

export function onMapPointerMove(evt) {
  const pixel = map.getEventPixel(evt.originalEvent);
  const hit = map.hasFeatureAtPixel(pixel);
  map.getTargetElement().style.cursor = hit ? 'pointer' : '';
}

let popover;
export function disposePopover() {
  if (overlay || popupinfo) {
    overlay.setPosition(undefined);
    popupinfo.setPosition(undefined);
  }
}

export function onMapClick(evt) {
    let feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });
    overlay.setPosition(undefined);
    popupinfo.setPosition(undefined);
    if (!feature) {
        // popupInputMarker(evt); // Komentari atau hapus baris ini
        return;
    } else {
        popupGetMarker(evt, feature);
    }
}

// function addToDatabase(namatempat, long, lat, lokasi, fasilitas, gambar) {
//   let dbData = { nama_tempat: namatempat, lon: long, lat: lat, lokasi: lokasi, fasilitas: fasilitas, gambar: gambar };

//   // Periksa apakah semua nilai tidak kosong atau null
//   if (!namatempat || !long || !lat || !lokasi || !fasilitas) {
//     alert('Semua field harus diisi!');
//     return;
//   }

//   // Periksa tipe data
//   if (typeof long !== 'number' || typeof lat !== 'number' || typeof namatempat !== 'string' || typeof lokasi !== 'string' || typeof fasilitas !== 'string' || (gambar && typeof gambar !== 'string')) {
//     alert('Tipe data tidak sesuai!');
//     return;
//   }

//  console.log("Mengirim data ke server:", dbData); // Tambahkan logging

  // fetch('https://asia-southeast2-backend-438507.cloudfunctions.net/parkirgratisbackend/tempat-parkir', { 
  //   method: 'POST',
  //   headers: {
  //       'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify(dbData)
  // })
  // .then(response => {
  //   console.log("Status respons:", response.status); // Tambahkan logging status respons
  //   return response.json().then(data => {
  //     console.log("Data respons:", data); // Tambahkan logging data respons
  //     if (!response.ok) {
  //       throw new Error(data.message || 'Terjadi kesalahan saat mengirim data');
  //     }
  //     return data;
  //   });
  // })
  // .then(data => {
  //   if (data.success) {
  //     alert('Data berhasil disimpan!');
  //   } else {
  //     alert('Berhasil menyimpan data');
  //   }
  // })
  // .catch(error => {
  //   console.error('Error:', error);
  //   alert('Terjadi kesalahan saat mengirim data: ' + error.message);
  // });
//}


// function tambahKoordinatKeDatabase(long, lat) {
//   const coordData = {
//     markers: [
//       [long, lat]
//     ]
//   };

//   console.log("Mengirim koordinat ke server:", coordData); // Tambahkan logging

//   fetch('https://asia-southeast2-backend-438507.cloudfunctions.net/parkirgratisbackend/koordinat', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(coordData)
//   })
//   .then(response => {
//     console.log("Status respons:", response.status); // Tambahkan logging status respons
//     return response.json().then(data => {
//       console.log("Data respons:", data); // Tambahkan logging data respons
//       if (!response.ok) {
//         throw new Error(data.error || 'Terjadi kesalahan saat mengirim data');
//       }
//       return data;
//     });
//   })
//   .then(data => {
//     if (data.message === 'Markers updated') {
//       console.log('Coordinates saved successfully:', data);
//       alert('Coordinates added successfully!');
//     } else {

    
//    }
//   })
//   .catch(error => {
//     console.error('Error:', error);
//     alert('Terjadi kesalahan saat mengirim data: ' + error.message);
//   });
// //}

// window.uploadImage = uploadImage;

// const target_url =
//   "https://asia-southeast2-backend-438507.cloudfunctions.net/parkirgratisbackend/upload/img";

// function uploadImage() {
//   if (!getValue("imageInput")) {
//     alert("Please select an image file");
//     return;
//   }x
//   hide("popup-input");
//   let besar = getFileSize("imageInput");
//   setInner("isi", besar);
  
//   postFile(target_url, "imageInput", "img", renderToHtml)
// }

// function renderToHtml(result) {
//   console.log(result);
//   setInner("isi", "https://parkirgratis.github.io/filegambar/" + result.response);
//   show("popup-input");
// }

// function handleUploadError(error) {
//   console.error(error);
//   if (error.status === 409) {
//     alert("File already exists or there is a conflict. Please try again with a different file.");
//   } else {
//     alert("An error occurred during the upload. Please try again.");
//   }
//   show("popup-input");
// }
