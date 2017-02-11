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

function setUpBrushes() {
  for (let brush of brushes) {
    $('#brushes').append('<img class="brush" src="' + brush + '">');
  }
  $('.brush').first().addClass('selected');
  brushCanvas = document.createElement('canvas');
  brushCtx = brushCanvas.getContext('2d');
  brushCursor = document.createElement('img');
  brushCursor.id = 'brush-cursor';
  $(brushCursor).css({
    position: 'absolute',
    visibility: 'hidden',
    'pointer-events': 'none'
  });
  $('#canvas-container').append(brushCursor);
}

function createBrushImage(isEraser) {
  console.log('In createBrushImage().');
  let brushImageSrc = (isEraser) ? eraserBrush :
    $('.brush.selected').first().prop('src');
  brushImage = null;
  let tmpImg = new Image();
  tmpImg.onload = function() {
    let strokeColorRgb = (isEraser) ? hexToRgb('#ffffff') : hexToRgb(strokeColor);
    brushCanvas.setAttribute('width', brushSize);
    brushCanvas.setAttribute('height', brushSize);
    brushCtx.clearRect(0, 0, brushSize, brushSize);
    brushCtx.drawImage(tmpImg, 0, 0, brushSize, brushSize);
    if (isEraser) {
      //Eraser brush cursor should be black as in the image file.
      brushCursor.src = brushCanvas.toDataURL('image/png');
    }
    //Change the image color to the selected color.
    let tmpBrushImageData = brushCtx.getImageData(0, 0, brushSize, brushSize);
    let data = tmpBrushImageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = strokeColorRgb.red;
      data[i + 1] = strokeColorRgb.green;
      data[i + 2] = strokeColorRgb.blue;
    }
    brushCtx.putImageData(tmpBrushImageData, 0, 0);
    brushImage = new Image();
    brushImage.src = brushCanvas.toDataURL('image/png');
    if (!isEraser) {
      //Paintbrush cursor should be the selected color.
      brushCursor.src = brushImage.src;
    }
  }
  tmpImg.src = brushImageSrc;
}
