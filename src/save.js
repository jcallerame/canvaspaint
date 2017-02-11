/*
 * CanvasPaint - A web application for drawing and painting
 * Copyright (c) 2016 John Callerame

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

//# sourceMappingURL=all.js.map

function saveCanvasImage(mimeType, suffix) {
  console.log('In saveCanvasImage()');
  let imageDataUrl = canvas.toDataURL(mimeType);
  let title = $('#title-div').text();
  if (title == null || title === '') {
    title = 'Untitled';
  }
  let filename = title + suffix;
  console.log('filename:', filename);
  let link = document.createElement('a');
  link.setAttribute('download', filename);
  link.setAttribute('href', imageDataUrl);
  if (document.createEvent) {
    console.log('doc.createEvent');
    let evt = document.createEvent('MouseEvents');
    evt.initEvent('click', true, true);
    link.dispatchEvent(evt);
  } else {
    console.log('clicking');
    link.click();
  }
  link = null;
}
