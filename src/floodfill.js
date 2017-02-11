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

function floodFill(startX, startY) {
  let fillRgba = hexToRgb(fillColor);
  fillRgba.alpha = Math.round(opacityElem.value * 255 / 100.0);
  let colorTolerance = Math.round(0.25 * 255);
  let width = canvas.width;
  let height = canvas.height;
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  let targetRgba = getColor(startX, startY, data, width, height);
  let visited = new Array(height);
  for (let x = 0; x < width; x++) {
    visited[x] = new Array(height);
  }
  let queue = [[startX, startY]];
  while (queue.length > 0) {
    let n = queue.shift();
    let x = n[0];
    let y = n[1];
    if (x < 0 || y < 0 || x >= width || y >= height || visited[x][y]) {
      continue;
    }
    let currentRgba = getColor(x, y, data, width, height);
    if (colorsClose(currentRgba, targetRgba, colorTolerance)) {
      setColor(x, y, fillRgba, data, width, height);
      visited[x][y] = true;
      queue.push([x - 1, y]);
      queue.push([x + 1, y]);
      queue.push([x, y - 1]);
      queue.push([x, y + 1]);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function getColor(x, y, data, width, height) {
  let idx = ((y * width) + x) * 4;
  return {
    red: data[idx],
    green: data[idx + 1],
    blue: data[idx + 2],
    alpha: data[idx + 3]
  };
}

function setColor(x, y, rgb, data, width, height) {
  let idx = ((y * width) + x) * 4;
  data[idx] = rgb.red;
  data[idx + 1] = rgb.green;
  data[idx + 2] = rgb.blue;
  data[idx + 3] = rgb.alpha;
}

//Compare two colors to see if they are close to each other.
//Return true if the two given colors' red, green, blue, and alpha levels differ
//by less than (or equal to) the given tolerance.
function colorsClose(c1, c2, tolerance) {
  let rdiff = Math.abs(c2.red - c1.red);
  let gdiff = Math.abs(c2.green - c1.green);
  let bdiff = Math.abs(c2.blue - c1.blue);
  return (rdiff <= tolerance && gdiff <= tolerance && bdiff <= tolerance);
}
