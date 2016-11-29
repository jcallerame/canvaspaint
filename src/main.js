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

'use strict';

const Tools = {DRAW: 1, LINE: 2, RECT: 3, ELLIPSE: 4, POLY: 5, TEXT: 6, PAINT: 7,
  FILL: 8, ERASER: 9};
const Keys = {RETURN: 13, ESC: 27};
const MAX_UNDO_TIMES = 12;
const TEMP_DRAWING_COLOR = '#C0C0FF';
let strokeColor = '#000000';
let fillColor = '#FF0000';
let snapshots = [];
let undoneSnapshots = [];
let canvas;
let selectedTool = Tools.DRAW;
let toolActive = false;
let ctx;
let strokeWidthElem, opacityElem;
let resizing = null;
let text, textPosX, textPosY;
let textBold = false;
let textItalics = false;
let textUnderline = false;
let textBoxWidth, textBoxHeight;
let vertices;
let mouseDownPos, currPos;
let interimSnapshot;
let dropdownMenuVisible = false;
let brushes = ['disc', 'block', 'cell', 'chalk', 'confetti', 'grass', 'scratch1', 'scratch2']
  .map(name => 'img/brushes/' + name + '.png');
let brushImage;
let brushCanvas, brushCtx;
let brushSize = 30;
let brushSpacing = 12;
let brushCursor;
let eraserBrush = 'img/brushes/block.png';
let eraserSize = 40;
let eraserSpacing = 1;
let fontFaces = [
  'Roboto',
  'Roboto Condensed',
  'Ubuntu',
  'Risque',
  'Indie Flower',
  'Inconsolata',
  'Oxygen',
  'Lobster',
  'Bree Serif',
  'Crimson Text',
  'Dancing Script',
  'Montez',
  'Josefin Slab',
  'Handlee',
  'Tangerine',
  'Nothing You Could Do',
  'Fontdiner Swanky'
];
let fontFace = 'Roboto';
let minCanvasWidth = 838;
let minCanvasHeight = 432;

console.log('Greetings!');

function finishStroke() {
  toolActive = false;
  snapshots.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (snapshots.length > MAX_UNDO_TIMES) {
    snapshots.shift();
  }
  undoneSnapshots = [];
  $('#undo-button').prop('disabled', false);
  $('#redo-button').prop('disabled', true);
}

function hideDropdownMenus() {
  $('.dropdown-menu').hide();
  $('.dropdown-button').removeClass('active');
  dropdownMenuVisible = false;
}

//Get red, green, and blue values from an HTML/CSS hex color value.
//This function is a slightly-modified version of the function at
//http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        red: parseInt(result[1], 16),
        green: parseInt(result[2], 16),
        blue: parseInt(result[3], 16)
    } : null;
}

function settingsChanged() {
  if (selectedTool === Tools.PAINT) {
    createBrushImage(false);
  }
  if (toolActive) {
    if (selectedTool === Tools.TEXT) {
      ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
      drawTextOnCanvasInBox();
    } else if (selectedTool === Tools.POLY) {
      ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
      drawPoly(ctx, vertices, false);
      interimSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      drawTempLine(mouseDownPos, currPos);
    }
  }
}

$(document).ready(function() {
  canvas = document.getElementById('canvas');
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;
  let toolboxWidth = $('#toolbox').outerWidth(true);  //include margin
  let canvasWidth = windowWidth - toolboxWidth - 10 - 8;
  let canvasHeight = windowHeight - $('#title-div-container').outerHeight() -
    $('#button-row').outerHeight() - 56 - 10;
  if (canvasWidth < minCanvasWidth) {
    canvasWidth = minCanvasWidth;
  }
  if (canvasHeight < minCanvasHeight) {
    canvasHeight = minCanvasHeight;
  }
  console.log('canvasHeight:', canvasHeight);
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  $('#canvas-container').width(canvasWidth).height(canvasHeight);
  $('#canvas-and-space-below').css('flex-basis', canvasWidth + 'px');
  let titleDivFocused = false;
  $('#title-div').on('click', function(e) {
    if ($(this).hasClass('untitled')) {
      $(this).removeClass('untitled');
      console.log('this =', this);
      selectText(this);
    }
    console.log('Setting titleDivFocused to true');
    titleDivFocused = true;
    e.stopPropagation();
  });
  $('#title-div').on('keypress', function(e) {
    if (e.keyCode === Keys.RETURN) {
      e.preventDefault();
      e.target.blur();
    }
  });
  $('#title-div').on('keyup', function(e) {
    document.title = 'CanvasPaint - ' + $(this).text();
  });

  selectFont(fontFace);

  for (let f of fontFaces) {
    let fontOption = $('<div></div>');
    $(fontOption).addClass('dropdown-option').addClass('font-option');
    $(fontOption).css('font-family', f);
    $(fontOption).text(f);
    $('#font-options').append(fontOption);
  }

  $('.font-option').on('click', function() {
    selectFont($(this).text());
    $('#font-options').hide();
    $('#font-dropdown').removeClass('active');
    settingsChanged();
  });

  let palette = [
    ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
    ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
    ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
    ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
    ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
    ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
    ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
    ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
  ];
  $('#stroke-color').spectrum({
    color: strokeColor,
    showPalette: true,
    palette: palette,
    change: function(color) {
      strokeColor = color.toHexString();
      settingsChanged();
    }
  });
  $('#fill-color').spectrum({
    color: fillColor,
    showPalette: true,
    palette: palette,
    change: function(color) {
      fillColor = color.toHexString();
      settingsChanged();
    }
  });
  $('.toolbox-button').on('click', function(e) {
    $('.toolbox-button').removeClass('selected');
    $(this).addClass('selected');
    $(this).blur();
    $('#canvas').removeClass();
    $('.draw-settings, .line-settings, .rect-settings, .ellipse-settings, ' +
        '.poly-settings, .text-settings, .paint-settings').hide();
    $('.tip').hide();
    switch(this.id) {
      case 'draw-button':
        selectedTool = Tools.DRAW;
        $('#canvas').addClass('draw-selected');
        $('.draw-settings').show();
        break;
      case 'line-button':
        selectedTool = Tools.LINE;
        $('#canvas').addClass('line-selected');
        $('.line-settings').show();
        $('#line-tip').show();
        break;
      case 'rect-button':
        selectedTool = Tools.RECT;
        $('#canvas').addClass('rect-selected');
        $('.rect-settings').show();
        $('#rect-tip').show();
        break;
      case 'ellipse-button':
        selectedTool = Tools.ELLIPSE;
        $('#canvas').addClass('ellipse-selected');
        $('.ellipse-settings').show();
        $('#ellipse-tip').show();
        break;
      case 'poly-button':
        selectedTool = Tools.POLY;
        $('#canvas').addClass('poly-selected');
        $('.poly-settings').show();
        $('#poly-tip').show();
        break;
      case 'text-button':
        selectedTool = Tools.TEXT;
        $('#canvas').addClass('text-selected');
        $('.text-settings').show();
        break;
      case 'paint-button':
        selectedTool = Tools.PAINT;
        $('#canvas').addClass('paint-selected');
        $('.paint-settings').show();
        createBrushImage(false);
        break;
      case 'fill-button':
        selectedTool = Tools.FILL;
        $('#canvas').addClass('fill-selected');
        $('.fill-settings').show();
        break;
      case 'eraser-button':
        selectedTool = Tools.ERASER;
        $('#canvas').addClass('eraser-selected');
        createBrushImage(true);
        break;
    }
  });
  $('#draw-button').click();
  ctx = canvas.getContext('2d');
  window.ctx = ctx;  //For debugging
  //Fill canvas with white (by default it's transparent).
  //This matters when the user saves (downloads) the image.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let imageData;
  strokeWidthElem = $('#stroke-width')[0];
  opacityElem = $('#opacity')[0];
  let canvasOffset = $('#canvas').offset();

  $(window).on('resize', function() {
    canvasOffset = $('#canvas').offset();
  });
  setUpBrushes();
  $('.brush').click(function() {
    $('.brush').removeClass('selected');
    $(this).addClass('selected');
    createBrushImage(false);
  });
  snapshots.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  $('#clear-button').on('click', function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //fill with background color
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    snapshots = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    undoneSnapshots = [];
    $('#undo-button').prop('disabled', true);
    $('#redo-button').prop('disabled', true);
  });
  $('#undo-button').on('click', function() {
    if (snapshots.length >= 2) {
      undoneSnapshots.push(snapshots.pop());
      ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
      $('#redo-button').prop('disabled', false);
    }
    if (snapshots.length < 2) {
      $('#undo-button').prop('disabled', true);
    }
  });
  $('#redo-button').on('click', function() {
    if (undoneSnapshots.length > 0) {
      let snapshot = undoneSnapshots.pop();
      snapshots.push(snapshot);
      ctx.putImageData(snapshot, 0, 0);
      $('#undo-button').prop('disabled', false);
    }
    if (undoneSnapshots.length === 0) {
      $('#redo-button').prop('disabled', true);
    }
  });

  $('#stroke-checkbox').on('change', function() {
    if (!$(this).prop('checked') && !$('#fill-checkbox').prop('checked')) {
      $('#fill-checkbox').prop('checked', true);
    }
    settingsChanged();
  });

  $('#fill-checkbox').on('change', function() {
    if (!$(this).prop('checked') && !$('#stroke-checkbox').prop('checked')) {
      $('#stroke-checkbox').prop('checked', true);
    }
    settingsChanged();
  });

  $([strokeWidthElem, opacityElem]).on('input change', function() {
    settingsChanged();
  });

  $('#bold-button, #italics-button').on('click', function() {
    $(this).toggleClass('selected');
    textBold = $('#bold-button').hasClass('selected');
    textItalics = $('#italics-button').hasClass('selected');
    settingsChanged();
    $(this).blur();
  });

  $('#brush-size').on('change', function() {
    brushSize = $(this).val();
    settingsChanged();
  });

  $('#brush-spacing').on('change', function() {
    brushSpacing = parseInt($(this).val());
    settingsChanged();
  });

  $('.slider').on('input change', function(event) {
    let readout = $(this).data('readout');
    if (readout != null) {
      let val = $(this).val();
      $(readout).text(val);
    }
  });

  let prevMouseDownPos, lastBrushStampPos;
  $('#canvas').on('mousedown', function(event) {
    event.preventDefault();
    prevMouseDownPos = mouseDownPos;
    mouseDownPos = {x: event.clientX - canvasOffset.left, y: event.clientY - canvasOffset.top};
    if (selectedTool === Tools.DRAW) {
      ctx.beginPath();
      //console.log("Setting strokeStyle to:", strokeColor);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidthElem.value;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = opacityElem.value / 100.0;
      ctx.moveTo(mouseDownPos.x, mouseDownPos.y);
    } else if (selectedTool === Tools.LINE || selectedTool === Tools.RECT ||
        selectedTool === Tools.ELLIPSE) {
      ctx.strokeStyle = TEMP_DRAWING_COLOR;
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 1;
    } else if (selectedTool === Tools.POLY) {
      let currPos = mouseDownPos;
      if (toolActive && event.shiftKey) {
        let dx = currPos.x - prevMouseDownPos.x;
        let dy = currPos.y - prevMouseDownPos.y;
        let absDx = Math.abs(dx);
        let absDy = Math.abs(dy);
        //If shift key is held down for line, draw horizontal or vertical lines.
        if (absDx >= absDy) {
          currPos.y = prevMouseDownPos.y;
        } else {
          currPos.x = prevMouseDownPos.x;
        }
      }
      if (!toolActive) {
        vertices = [];
      }
      vertices.push(currPos);
      if (toolActive) {
        ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
        drawPoly(ctx, vertices, false);
      }
      interimSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else if (selectedTool === Tools.TEXT) {
      if (!toolActive) {
        toolActive = true;
        text = 'Type some text';
        textPosX = mouseDownPos.x;
        textPosY = mouseDownPos.y;
        textBoxWidth = 250;
        textBoxHeight = 36.8;
        let fontProp = drawTextOnCanvasInBox();
        createTextBox(fontProp);
      } else {
        $('#text-box-container').remove();
        finishStroke();
        $(document).off('mousemove.textbox');
        $(document).off('mouseup.textbox');
      }
    } else if (selectedTool === Tools.PAINT || selectedTool === Tools.ERASER) {
      if (selectedTool === Tools.PAINT) {
        ctx.globalAlpha = opacityElem.value / 100.0;
      }
      if (brushImage != null) {
        ctx.drawImage(brushImage, mouseDownPos.x - (brushSize / 2),
          mouseDownPos.y - (brushSize / 2));
        lastBrushStampPos = mouseDownPos;
      }
    } else if (selectedTool === Tools.FILL) {
      floodFill(mouseDownPos.x, mouseDownPos.y);
      finishStroke();
    }
    if (selectedTool !== Tools.TEXT && selectedTool !== Tools.FILL) {
      toolActive = true;
    }
  });
  let centerX, centerY, radiusX, radiusY;
  $('#canvas').on('mousemove', function(event) {
    if (selectedTool === Tools.PAINT || selectedTool === Tools.ERASER) {
      brushCursor.style.left = (event.clientX - canvasOffset.left - (brushSize / 2)) + 'px';
      brushCursor.style.top = (event.clientY - canvasOffset.top - (brushSize / 2)) + 'px';
      brushCursor.style.visibility = 'visible';
    }
    if (toolActive) {
      currPos = {x: event.clientX - canvasOffset.left, y: event.clientY - canvasOffset.top};
      if (event.shiftKey) {
        let dx = currPos.x - mouseDownPos.x;
        let dy = currPos.y - mouseDownPos.y;
        let absDx = Math.abs(dx);
        let absDy = Math.abs(dy);
        if (selectedTool === Tools.LINE || selectedTool === Tools.POLY) {
          //If shift key is held down for line, draw horizontal or vertical lines.
          if (absDx >= absDy) {
            currPos.y = mouseDownPos.y;
          } else {
            currPos.x = mouseDownPos.x;
          }
        } else if (selectedTool === Tools.RECT || selectedTool === Tools.ELLIPSE) {
          //If shift key is held down for rect or ellipse, make it a square or a circle.
          let signX = sign(dx);
          let signY = sign(dy);
          if (absDx <= absDy) {
            currPos = {x: mouseDownPos.x + (signX * absDx), y: mouseDownPos.y + (signY * absDx)};
          } else {
            currPos = {x: mouseDownPos.x + (signX * absDy), y: mouseDownPos.y + (signY * absDy)};
          }
        }
      }
      if (contains(selectedTool, [Tools.DRAW, Tools.LINE, Tools.RECT, Tools.ELLIPSE])) {
        ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
      }
      if (selectedTool === Tools.DRAW) {
        ctx.lineTo(currPos.x, currPos.y);
        ctx.stroke();
      } else if (selectedTool === Tools.LINE) {
        drawTempLine(mouseDownPos, currPos);
      } else if (selectedTool === Tools.RECT) {
        ctx.strokeRect(mouseDownPos.x, mouseDownPos.y, currPos.x - mouseDownPos.x + 1,
          currPos.y - mouseDownPos.y + 1);
      } else if (selectedTool === Tools.ELLIPSE) {
        centerX = (currPos.x + mouseDownPos.x) / 2;
        centerY = (currPos.y + mouseDownPos.y) / 2;
        radiusX = (currPos.x - mouseDownPos.x + 1) / 2;
        radiusY = (currPos.y - mouseDownPos.y + 1) / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (selectedTool === Tools.POLY) {
        //console.log("interimSnapshot:", interimSnapshot);
        ctx.putImageData(interimSnapshot, 0, 0);
        drawTempLine(mouseDownPos, currPos);
      } else if (selectedTool === Tools.PAINT || selectedTool === Tools.ERASER) {
        let dx = currPos.x - lastBrushStampPos.x;
        let dy = currPos.y - lastBrushStampPos.y;
        let totalDist = Math.sqrt((dx * dx) + (dy * dy));
        let spacing = (selectedTool === Tools.ERASER) ? eraserSpacing : brushSpacing;
        if (totalDist >= spacing) {
          let angle = Math.atan2(dy, dx);
          let stampPos;
          for (let stampDist = spacing; stampDist <= totalDist; stampDist += spacing) {
            stampPos = {
              x: lastBrushStampPos.x + (Math.cos(angle) * stampDist),
              y: lastBrushStampPos.y + (Math.sin(angle) * stampDist)
            };
            ctx.drawImage(brushImage, stampPos.x - (brushSize / 2),
              stampPos.y - (brushSize / 2));
          }
          lastBrushStampPos = stampPos;
        }
      }
    }
  });
  $('#canvas').on('mouseup', function(event) {
    if (toolActive) {
      if (selectedTool === Tools.LINE) {
        ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidthElem.value;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = opacityElem.value / 100.0;
        ctx.beginPath();
        ctx.moveTo(mouseDownPos.x, mouseDownPos.y);
        ctx.lineTo(currPos.x, currPos.y);
        ctx.stroke();
      } else {
        if (selectedTool === Tools.RECT || selectedTool === Tools.ELLIPSE) {
          let usingStroke = $('#stroke-checkbox').prop('checked');
          let usingFill = $('#fill-checkbox').prop('checked');
          ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
          ctx.strokeStyle = strokeColor;
          ctx.fillStyle = fillColor;
          ctx.lineWidth = strokeWidthElem.value;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = opacityElem.value / 100.0;
          if (selectedTool === Tools.RECT) {
            if (usingFill) {
              ctx.fillRect(mouseDownPos.x, mouseDownPos.y, currPos.x - mouseDownPos.x + 1,
                currPos.y - mouseDownPos.y + 1);
            }
            if (usingStroke) {
              ctx.strokeRect(mouseDownPos.x, mouseDownPos.y, currPos.x - mouseDownPos.x + 1,
                currPos.y - mouseDownPos.y + 1);
            }
          } else if (selectedTool === Tools.ELLIPSE) {
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            if (usingFill) {
              ctx.fill();
            }
            if (usingStroke) {
              ctx.stroke();
            }
          }
        }
      }
      if (selectedTool !== Tools.POLY) {
        finishStroke();
      }
    }
  });

  $('#canvas-container').on('mouseenter', function(event) {
    if (selectedTool === Tools.PAINT || selectedTool === Tools.ERASER) {
      brushCursor.style.left = (event.clientX - canvasOffset.left - (brushSize / 2)) + 'px';
      brushCursor.style.top = (event.clientY - canvasOffset.top - (brushSize / 2)) + 'px';
      brushCursor.style.visibility = 'visible';
    }
  });

  $('#canvas-container').on('mouseleave', function(event) {
    if (selectedTool === Tools.PAINT || selectedTool === Tools.ERASER) {
      brushCursor.style.visibility = 'hidden';
    }
  });

  $(document).on('keyup', function(event) {
    if (selectedTool === Tools.POLY && toolActive) {
      if (event.keyCode === Keys.ESC) {
        ctx.putImageData(interimSnapshot, 0, 0);
        finishStroke();
      } else if (event.keyCode === Keys.RETURN) {
        ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
        drawPoly(ctx, vertices, true);
        finishStroke();
      }
    }
  });

  $('.dropdown-button').on('click', function(event) {
    $(this).blur();
    $(this).toggleClass('active');
    let target = $(this).data('target');
    $(target).toggle();
    dropdownMenuVisible = true;
    event.stopPropagation();
  });

  $('.dropdown-menu').on('mousedown', function(event) {
    event.stopPropagation();
  });

  $(document).on('mousedown', function(event) {
    if (dropdownMenuVisible) {
      hideDropdownMenus();
    }
    if (titleDivFocused) {
      console.log('titleDivFocused');
      if (!/\S/.test($('#title-div').text())) {
        $('#title-div').text('Untitled');
      }
      if ($('#title-div').text() === 'Untitled') {
        $('#title-div').addClass('untitled');
      } else {
        $('#title-div').removeClass('untitled');
      }
      titleDivFocused = false;
      $('#title-div').blur();
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    }
  });

  $('#save-as-png-button').on('click', function(e) {
    saveCanvasImage('image/png', '.png');
    hideDropdownMenus();
    e.stopPropagation();
  });

  $('#save-as-jpeg-button').on('click', function(e) {
    saveCanvasImage('image/jpeg', '.jpg');
    hideDropdownMenus();
    e.stopPropagation();
  });

  $('.modal-link').on('click', function(e) {
    console.log('Modal link clicked.');
    let modalSelector = $(this).data('target');
    $('#modal-overlay').show();
    $(modalSelector).show();
  });

  $('.modal-cancel-button').on('click', function(e) {
    $('.modal').hide();
    $('#modal-overlay').hide();
  });
});
