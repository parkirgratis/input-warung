import {map} from '../config/peta.js';
import {disposePopover} from '../controller/popup.js';

export function getAllCoordinates(){
    let i=0;
    let sudahhapus=0;
    let pointlist = [];
    map.getLayers().forEach(layer => {
      if (i !== 0 && sudahhapus === 0) {
        layer.getSource().getFeatures().forEach( feature =>
          {
            let node = {
                id : feature.get('id'),
                xy : feature.get('geometry').flatCoordinates,
            }
            pointlist.push(node);
          }
        );
      }
      i++;
    });
    console.log(pointlist);
    disposePopover();
}