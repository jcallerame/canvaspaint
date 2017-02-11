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

function drawTempLine(startPos, endPos) {
  ctx.strokeStyle = TEMP_DRAWING_COLOR;
  ctx.globalAlpha = 1.0;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startPos.x, startPos.y);
  ctx.lineTo(endPos.x, endPos.y);
  ctx.stroke();
}

function drawPoly(ctx, vertices, closePath) {
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = strokeWidthElem.value;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = opacityElem.value / 100.0;
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  if (closePath) {
    ctx.closePath();
  }
  let usingStroke = $('#stroke-checkbox').prop('checked');
  let usingFill = $('#fill-checkbox').prop('checked');
  if (usingFill) {
    ctx.fill();
  }
  if (usingStroke) {
    ctx.stroke();
  }
}
