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

function selectText(elem) {
  if (document.selection) {
    console.log("Using document.selection");
    var range = document.body.createTextRange();
    range.moveToElementText(elem);
    range.select();
  } else if (window.getSelection) {
    console.log("Using window.getSelection");
    var range = document.createRange();
    range.selectNodeContents(elem);
    window.getSelection().addRange(range);
  }
}

function selectFont(fontName) {
  fontFace = fontName;
  $('#font-dropdown-text').css('font-family', fontName).text(fontName);
}

function getFontProp(fontSize) {
  let fontProp = '';
  if (textItalics) {
    fontProp += 'italic ';
  }
  if (textBold) {
    fontProp += 'bold ';
  }
  fontProp += fontSize + 'px "' + fontFace + '"';
  return fontProp;
}

function drawTextOnCanvasInBox() {
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = strokeWidthElem.value;
  ctx.globalAlpha = opacityElem.value / 100.0;
  ctx.textBaseline = 'top';
  //Reduce font size by 1.0px per step...
  let fontSize = textBoxHeight;
  let fontProp = getFontProp(fontSize);
  ctx.font = fontProp;
  console.log('measuring text with font prop =', fontProp);
  while (ctx.measureText(text).width > textBoxWidth) {
    fontSize -= 1.0;
    fontProp = getFontProp(fontSize);
    ctx.font = fontProp;
  }
  //...and then increase it by 0.1px per step, until we hit the right size.
  //We do this to keep performance reasonable when resizing tall and narrow text
  //boxes, while still giving us fine-grained font size changes as we resize
  //the text box.
  fontSize += 0.1;
  fontProp = getFontProp(fontSize);
  ctx.font = fontProp;
  while (fontSize <= textBoxHeight && ctx.measureText(text).width < textBoxWidth) {
    fontSize += 0.1;
    fontProp = getFontProp(fontSize);
    ctx.font = fontProp;
  }
  fontSize -= 0.1;
  fontProp = getFontProp(fontSize);
  ctx.font = fontProp;
  //console.log('fontSize =', fontSize);
  //console.log('ctx.font =', ctx.font);
  //console.log('text width =', ctx.measureText(text).width);
  console.log('fontProp set to:', fontProp);
  drawTextOnCanvas();
  return fontProp;
}

function drawTextOnCanvas() {
  let usingStroke = document.getElementById('stroke-checkbox').checked;
  let usingFill = document.getElementById('fill-checkbox').checked;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = strokeWidthElem.value;
  ctx.globalAlpha = opacityElem.value / 100.0;
  if (usingFill) {
    ctx.fillText(text, textPosX, textPosY);
  }
  if (usingStroke) {
    ctx.strokeText(text, textPosX, textPosY);
  }
}

function createTextBox(fontProp) {
  let textBoxContainer = document.createElement('div');
  textBoxContainer.id = 'text-box-container';
  let canvasPos = $(canvas).position();
  $(textBoxContainer).css({
    position: 'absolute',
    left: (canvasPos.left + textPosX) + 'px',
    top: (canvasPos.top + textPosY) + 'px',
    width: textBoxWidth + 'px',
    height: textBoxHeight + 'px',
    border: '1px solid black',
    'z-index': 1
  });
  $('#canvas-container').append(textBoxContainer);
  //document.body.appendChild(textBoxContainer);
  let textBox = document.createElement('div');
  $(textBox).prop('contenteditable', true);
  textBox.id = 'text-box';
  let wtfcSupport = ('webkitTextFillColor' in textBox.style);
  console.log('wtfcSupport =', wtfcSupport);
  $(textBox).css({
    width: '100%',
    height: '100%',
    'word-wrap': 'break-word',
    'word-break': 'normal',
    'overflow-wrap': 'normal',
    'white-space': 'pre-wrap',
    font: fontProp,
    'background-color': 'transparent',
    'z-index': 1,
    resize: 'none'
  });
  if (wtfcSupport) {
    $(textBox).css({
      color: 'black',
      '-webkit-text-fill-color': 'transparent'
    });
  } else {
    $(textBox).css('color', 'transparent');
  }
  $(textBox).text(text);
  textBoxContainer.appendChild(textBox);
  $(textBox).focus();
  selectText(textBox);
  $(textBox).on('keypress', function(e) {
    if (e.keyCode === Keys.RETURN || e.keyCode === Keys.ESC) {
      e.preventDefault();
    }
  });
  $(textBox).on('keyup', function(e) {
    if (e.keyCode === Keys.ESC) {
      console.log('Escape pressed.');
      $(textBoxContainer).remove();
      ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
      toolActive = false;
    } else if (e.keyCode === Keys.RETURN) {
      $('#text-box-container').remove();
      finishStroke();
      $(document).off('mousemove.textbox');
      $(document).off('mouseup.textbox');
    } else {
      text = $(textBox).text();
      ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
      fontProp = drawTextOnCanvasInBox();
      $(textBox).css('font', fontProp);
    }
  });

  //Draw resize box handles
  const resizeBoxSize = 7;
  for (let ry = -1; ry <= 1; ry++) {
    for (let rx = -1; rx <= 1; rx++) {
      //No box in center
      if (rx === 0 && ry === 0)
        continue;
      let cursor;
      if (rx == 0)
        cursor = 'ns-resize';
      else if (ry == 0)
        cursor = 'ew-resize';
      else if (rx + ry == 0)
        cursor = 'nesw-resize';
      else
        cursor = 'nwse-resize';
      let resizeBox = document.createElement('div');
      $(resizeBox).css({
        display: 'inline-block',
        position: 'absolute',
        left: 'calc(' + ((rx + 1) * 50) + '% - ' + ((resizeBoxSize - 1) / 2) + 'px)',
        top: 'calc(' + ((ry + 1) * 50) + '% - ' + ((resizeBoxSize - 1) / 2) + 'px)',
        width: resizeBoxSize + 'px',
        height: resizeBoxSize + 'px',
        'z-index': 2,
        border: '1px solid black',
        'background-color': 'white',
        cursor: cursor
      });
      $(resizeBox).data('resizeX', rx).data('resizeY', ry);
      $(resizeBox).addClass('text-box-resize');
      textBoxContainer.appendChild(resizeBox);
    }
  }

  let moveBoxSize = 20;
  function getMoveBoxPosCss() {
    let moveBoxDistFromTextBox = 10;
    let moveBoxHorizOffset = -(moveBoxSize + resizeBoxSize);
    let moveBoxVertOffset = -(moveBoxSize + moveBoxDistFromTextBox);
    let textBoxContainerPos = $(textBoxContainer).position();
    //console.log('getMoveBoxPosCss(): textBoxContainerPos =', textBoxContainerPos);
    let moveBoxPosCss = {
      left: '',
      right: '',
      top: '',
      bottom: ''
    };
    if (textBoxContainerPos.left >= -moveBoxHorizOffset) {
      moveBoxPosCss.left = moveBoxHorizOffset + 'px';
    } else {
      moveBoxPosCss.right = moveBoxHorizOffset + 'px';
    }
    if (textBoxContainerPos.top >= -moveBoxVertOffset) {
      moveBoxPosCss.top = moveBoxVertOffset + 'px';
    } else {
      moveBoxPosCss.bottom = moveBoxVertOffset + 'px';
    }
    //console.log('moveBoxPosCss:', moveBoxPosCss);
    return moveBoxPosCss;
  }
  let moveBox = document.createElement('div');
  $(moveBox).addClass('text-box-move')
    .data('resizeX', 0)
    .data('resizeY', 0)
    .css({
      display: 'inline-block',
      position: 'absolute',
      width: moveBoxSize + 'px',
      height: moveBoxSize + 'px',
      'z-index': 2,
      border: '1px solid black',
      'background-image': 'url("img/move-icon.svg")',
      'background-size': 'cover',
      'background-repeat': 'no-repeat',
      'background-position': 'center',
      cursor: 'move',
      opacity: '0.65'
    });
  $(moveBox).css(getMoveBoxPosCss());

  textBoxContainer.appendChild(moveBox);

  //Handle dragging on resize box handles
  let moveResizeStartCursorPos, moveResizeStartTextBoxPos, moveResizeStartTextBoxWidth, moveResizeStartTextBoxHeight;
  let resizing = null;
  let minCanvasOverlap = 3; //Minimum number of pixels of text box which must stay on canvas
  $('.text-box-move, .text-box-resize').on('mousedown', function(event) {
    $(textBox).css('pointer-events', 'none');
    resizing = [$(this).data('resizeX'), $(this).data('resizeY')];
    console.log('resizing:', resizing);
    moveResizeStartCursorPos = {x: event.clientX, y: event.clientY};
    moveResizeStartTextBoxPos = $(textBoxContainer).position();
    //console.log('resizeStartBoxPos:', resizeStartBoxPos);
    moveResizeStartTextBoxWidth = $(textBoxContainer).innerWidth();
    moveResizeStartTextBoxHeight = $(textBoxContainer).innerHeight();
    event.preventDefault();
  });
  $(document).on('mouseup.textbox', function() {
    resizing = null;
    $(textBox).css('cursor', 'text');
    $(textBox).css('pointer-events', '');
    $(moveBox).css(getMoveBoxPosCss());
  });
  $(document).on('mousemove.textbox', function(event) {
    if (resizing != null) {
      let currentCursorPos = {x: event.clientX, y: event.clientY};
      let xdiff = currentCursorPos.x - moveResizeStartCursorPos.x;
      let ydiff = currentCursorPos.y - moveResizeStartCursorPos.y;
      let newLeft = moveResizeStartTextBoxPos.left;
      let newTop = moveResizeStartTextBoxPos.top;
      let newWidth = moveResizeStartTextBoxWidth;
      let newHeight = moveResizeStartTextBoxHeight;
      if (resizing[0] === -1) {
        //Resize left
        //Check position and bounds
        if (moveResizeStartTextBoxPos.left + xdiff > canvasPos.left + canvas.width -
            minCanvasOverlap) {
          xdiff = canvasPos.left + canvas.width - minCanvasOverlap -
            moveResizeStartTextBoxPos.left;
        }
        //Set width and position
        newWidth = moveResizeStartTextBoxWidth - xdiff;
        newLeft = moveResizeStartTextBoxPos.left + xdiff;
      } else if (resizing[0] === 1) {
        //Resize right
        //Check bounds
        if (moveResizeStartTextBoxPos.left + moveResizeStartTextBoxWidth + xdiff < canvasPos.left +
            minCanvasOverlap) {
          xdiff = canvasPos.left + minCanvasOverlap - moveResizeStartTextBoxPos.left -
            moveResizeStartTextBoxWidth;
        }
        //Set width
        newWidth = moveResizeStartTextBoxWidth + xdiff;
      }
      if (resizing[1] === -1) {
        //Resize top
        //Check bounds
        if (moveResizeStartTextBoxPos.top + ydiff >
            canvasPos.top + canvas.height - minCanvasOverlap) {
          ydiff = canvasPos.top + canvas.height - minCanvasOverlap -
            moveResizeStartTextBoxPos.top;
        }
        //Set height and position
        newHeight = moveResizeStartTextBoxHeight - ydiff;
        newTop = moveResizeStartTextBoxPos.top + ydiff;
      } else if (resizing[1] === 1) {
        //Resize bottom
        //Check bounds
        if (moveResizeStartTextBoxPos.top + moveResizeStartTextBoxHeight + ydiff < canvasPos.top +
            minCanvasOverlap) {
          ydiff = canvasPos.top + minCanvasOverlap - moveResizeStartTextBoxPos.top -
            moveResizeStartTextBoxHeight;
        }
        //Set height
        newHeight = moveResizeStartTextBoxHeight + ydiff;
      }
      let moving = false;
      if (resizing[0] === 0 && resizing[1] === 0) {
        //Moving
        moving = true;
        //Set position
        newLeft = moveResizeStartTextBoxPos.left + xdiff;
        newTop = moveResizeStartTextBoxPos.top + ydiff;
        //Check bounds
        if (newLeft + moveResizeStartTextBoxWidth < canvasPos.left + minCanvasOverlap) {
          newLeft = canvasPos.left + minCanvasOverlap - moveResizeStartTextBoxWidth;
        }
        if (newLeft > canvasPos.left + canvas.width - minCanvasOverlap) {
          newLeft = canvasPos.left + canvas.width - minCanvasOverlap;
        }
        if (newTop + moveResizeStartTextBoxHeight < canvasPos.top + minCanvasOverlap) {
          newTop = canvasPos.top + minCanvasOverlap - moveResizeStartTextBoxHeight;
        }
        if (newTop > canvasPos.top + canvas.height - minCanvasOverlap) {
          newTop = canvasPos.top + canvas.height - minCanvasOverlap;
        }
      }
      //console.log('newLeft =', newLeft, ', newTop =', newTop);
      textBoxContainer.style.left = newLeft + 'px';
      textBoxContainer.style.top = newTop + 'px';
      textBoxContainer.style.width = newWidth + 'px';
      textBoxContainer.style.height = newHeight + 'px';
      textPosX = newLeft - canvasPos.left;
      textPosY = newTop - canvasPos.top;
      textBoxWidth = newWidth;
      textBoxHeight = newHeight;
      ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
      if (moving) {
        drawTextOnCanvas();
      } else {
        fontProp = drawTextOnCanvasInBox();
      }
      textBox.style.font = fontProp;
      event.stopPropagation();
    }
  });
}
