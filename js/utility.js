// From Peter Bailey @ https://stackoverflow.com/questions/1267283/how-can-i-pad-a-value-with-leading-zeros
function zeroFill( number, width )
{
  width -= number.toString().length;
  if ( width > 0 )
  {
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number + ""; // always return a string
}

/**
 * Allows dragging of elements using the mouse. Adapted from W3Schools' tutorial.
 * @param {Element} element - the element to be dragged.
 */
function enableDragOnElem(element) {
  let initialX = 0;
  let initialY = 0;
  let xMoveDistance = 0;
  let yMoveDistance = 0;

  element.querySelector(".sticky-note-header").onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    // get the mouse cursor position at startup:
    initialX = e.clientX;
    initialY = e.clientY;
    // call a function when the mouse button is no longer pressed.
    // This, of course, only pertains to the scope of the bulletin area.
    bulletinStickies.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    bulletinStickies.onmousemove = elementDrag;
    // bring that to the front too
    bringToFront(element);
  }

  function elementDrag(e) {
    // calculate the new cursor position:
    xMoveDistance = initialX - e.clientX;
    yMoveDistance = initialY - e.clientY;
    // set the element's new position using the new cursor position
    // #region explanation
    // offsetTop is a (read-only value) that represents the top position
    // relative to the top of its nearest relative ancestor (the bulletin in this case)
    // negative values of yMoveDistance will move the element down.
    // negative values of xMoveDistance will move the element right.
    // Movement is calculated as the difference between current offset and movement.
    // #endregion
    element.style.top = (element.offsetTop - yMoveDistance) + "px";
    element.style.left = (element.offsetLeft - xMoveDistance) + "px";
    // update initialX and initialY for the next time this is called.
    initialX = e.clientX;
    initialY = e.clientY;
  }

  function closeDragElement() {
    // callbacks are disabled when the user releases mouse button.
    // the element will no longer change its top / left values.
    bulletinStickies.onmouseup = null;
    bulletinStickies.onmousemove = null;
  }
}

