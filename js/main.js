/**
 * Main script for running sticky note program.
 * 
 * Author: Dan Trinh
 * Date: July 2021
 * Ver: 1
 */

const defaultSticky = document.querySelector("#sample-sticky-note");
const bulletinStickies = document.querySelector("#bulletin-stickies");
const notesList = document.querySelector("#notes-list section:not([id^=sample]");
let spawnRight = true; // boolean to determine direction of spawn for stickies.
let lastChanged = null;

/**
 * A callback when the user presses the add sticky note button.
 * @param {Event} e 
 */
 function addStickyNote(e) {
  console.log("Adding a sticky note...");

  let newStickyNoteNode;
  let notePosition;

  // clone the sample sticky note
  newStickyNoteNode = defaultSticky.cloneNode(true);
  newStickyNoteNode.id = Date.now();
  // z-Index to # of sticky notes + 1 to be inclusive of the element.
  newStickyNoteNode.style.zIndex = bulletinStickies.childElementCount + 1;

  notePosition = determineSpawnPosition();
  newStickyNoteNode.style.left = `${notePosition.x}px`;
  newStickyNoteNode.style.top = `${notePosition.y}px`;

  // render it on the view
  bulletinStickies.appendChild(newStickyNoteNode);
  bringToFront(newStickyNoteNode);
  addToNotesList(newStickyNoteNode);

  // assign various event listeners
  assignStickyFunctionality(newStickyNoteNode, false);
}

/**
 * Assigns a variety of event listeners to a sticky note, enabling 
 * various functionalities upon user interaction.
 * @param {Element} sticky - The sticky note to assign event listeners to.
 * @param {boolean} startCollapsed - Should the sticky note be rendered with a collapsed menu?
 *    False by default.
 */
function assignStickyFunctionality(sticky, startCollapsed = false){
  const closeButton = sticky.querySelector("button.close-sticky-note-button");
  const title = sticky.querySelector("input.title-edit");
  const menuButton = sticky.querySelector(`.toggle-menu-button`);
  const priorityMenu = sticky.querySelector(".priority-label");
  const textField = sticky.querySelector(".text-content");

  // close sticky note functionality
  closeButton.addEventListener("click", closeStickyNote);
  closeButton.addEventListener("mousedown", (e) => e.stopPropagation());
  // show/hide sticky note menu
  menuButton.addEventListener("click", toggleStickyMenu);
  if (startCollapsed) {
    sticky.querySelector("i").classList.toggle("menu-opened");
    sticky.querySelector(".toolbar").classList.toggle("slide-in-out");
  }
  // enable drag functionality
  enableDragOnElem(sticky);

  // generate a color palette menu
  renderColorPalette(sticky.querySelector(".color-picker-options"));
  // hook up the tab to respond to changes on the sticky note
  // the title of the note
  title.addEventListener("change", updateNoteTabTitle);
  // the priority of the note
  priorityMenu.addEventListener("change", updateNoteTabPriority);
  // the text content of the note
  // changing the value updates the note tab time.
  textField.addEventListener("change", e => {
    let parent = getStickyParentNode(e);
    let tab = document.querySelector(`#tab-${parent.id}`);
    updateNoteTabTime(new Date(), tab);
  });
  // clicking on it brings the note to the front
  textField.addEventListener("click", e => {
    let parent = getStickyParentNode(e);
    bringToFront(parent);
  });
}


function determineSpawnPosition() {
  const offsetValue = 5;
  let newOffsetLeft;
  let stickyNotes;
  let lastCreatedStickyNote;
  let lastCreatedXPosition;
  let lastCreatedYPosition;

  // query all notes
  stickyNotes = document.querySelectorAll(".sticky-note");
  // get the last child in the list, as the position should be based off the
  // most recently created note.
  lastCreatedStickyNote = stickyNotes.item(stickyNotes.length - 1);
  // the position we'll want to spawn should be right *after* the note, so offset + width.
  lastCreatedXPosition = lastCreatedStickyNote.clientWidth + +lastCreatedStickyNote.style.left.split("px")[0];
  // determine if there's space on the right or the left
  // no more space on the left? spawn on the left side.
  if (lastCreatedXPosition + offsetValue < bulletinStickies.clientWidth && spawnRight === true) {
    newOffsetLeft = lastCreatedXPosition + offsetValue;
  } else {
    newOffsetLeft = lastCreatedXPosition - (lastCreatedStickyNote.clientWidth * 1.5) - offsetValue;
    spawnRight = false;
    // if the the new stickyNode offset is negative, we should start spawning it
    // on the right side of the sticky note the next time.
    if (newOffsetLeft < 0) {
      spawnRight = true;
    }
  }
  // now get the offset of the top. Not much to the offsetting the top.
  lastCreatedYPosition = +lastCreatedStickyNote.style.top.split("px")[0];

  return {x: newOffsetLeft, y: lastCreatedYPosition};
}


/**
 * This function brings a sticky note to the front
 * and pushes the other windows back.
 * 
 * It is used whenever a sticky note is created to bring it to the front,
 * and when the user clicks on it.
 * 
 * @param {Node} selectedNote - The note that was clicked on.
 */
function bringToFront(selectedNote) {
  let stickyNotes = Array.from(bulletinStickies.querySelectorAll(".sticky-note:not(#sample-sticky-note)"));

  // only bother changing the zIndex if the zIndex isn't already the top.
  if (+selectedNote.style.zIndex !== stickyNotes.length) {
    stickyNotes.find(note => note.id === selectedNote.id).style.zIndex = stickyNotes.length;
  }

  if (lastChanged !== null && lastChanged !== selectedNote.id) {
    stickyNotes.forEach(note => {
      if (note.id != selectedNote.id && note.style.zIndex > 1) {
        note.style.zIndex -= 1;
      }
    });
  }

  lastChanged = selectedNote.id;
}

/**
 * After creating a sticky note, adds the note to the tab list on the left-hand side.
 * @param {Node} note - Element node representing the element to add.
 */
function addToNotesList(note) {
  let newTab = document.querySelector("#sample-sticky-note-tab").cloneNode(true);

  newTab.id = "tab-" + note.id;
  newTab.querySelector("h2").textContent = "Untitled";
  newTab.style.borderTop = `5px solid hsl(0,100%, 75%)`;
  newTab.querySelector(".note-priority").textContent = "";

  // create a timestamp
  let time = new Date(+note.id);
  updateNoteTabTime(time, newTab);

  // add to notes tree, but insert before if the user has already entered something.
  if (notesList.hasChildNodes()) {
    notesList.insertBefore(newTab, notesList.querySelector(".sticky-note-tab"));
  } else {
    notesList.append(newTab);
  }

  assignTabFunctionality(newTab);
}

/**
 * Assigns functionalities (event listener callbacks)
 * to a tab element on the view.
 * @param {Element} tab - The tab to assign functionalities to.
 */
function assignTabFunctionality(tab){
  const resetPositionButton = tab.querySelector(".reset-pos-button")

  // and add event listeners for the tab too.
  tab.addEventListener("click", (e) =>{
    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.55)";
    let id = e.currentTarget.id.split("tab-")[1];
    let sticky = document.getElementById(id);
    bringToFront(sticky);
  });

  tab.addEventListener("transitionend", (e) => {
    e.currentTarget.style.backgroundColor = "";
  });

  tab.addEventListener("mouseover", (e) => {
    resetPositionButton.classList.remove("hide-no-display");
  });

  tab.addEventListener("mouseout", (e) => {
    resetPositionButton.classList.add("hide-no-display");
  });

  resetPositionButton.addEventListener("click", resetStickyLocation);
}

function resetStickyLocation(e){
  let id = e.currentTarget.parentNode.id.split("tab-")[1];
  let sticky = document.getElementById(id);
  sticky.style.top = "0px";
  sticky.style.left = "0px";
}

function closeStickyNote(e) {
  let response = confirm("Are you sure you want to delete this note?");
  if (response) {
    let stickyNote = getStickyParentNode(e);
    // remove from bulletin and notes list.
    bulletinStickies.removeChild(stickyNote);
    notesList.removeChild(document.querySelector(`#tab-${stickyNote.id}`));
  }
}

function updateNoteTabTitle(e) {
  const parent = getStickyParentNode(e);

  let stickyTab = notesList.querySelector(`#tab-${parent.id}`);
  stickyTab.querySelector(".tab-title").textContent = e.currentTarget.value;

  // create a timestamp
  let time = new Date();

  updateNoteTabTime(time, stickyTab);
}

function updateNoteTabPriority(e) {
  const parent = getStickyParentNode(e);
  const priority = e.currentTarget.value;

  let stickyTab = notesList.querySelector(`#tab-${parent.id}`);
  let priorityText = stickyTab.querySelector(".note-priority");
  priorityText.textContent = (priority === "none") ? "" : priority;

  switch (priority) {
    case "none":
      break;
    case "normal":
      priorityText.textContent += " ★";
      priorityText.style.color = "yellow";
      break;
    case "high":
      priorityText.textContent += " ★★";
      priorityText.style.color = "orange";
      break;
    case "critical":
      priorityText.textContent += " ★★★";
      priorityText.style.color = "red";
      break;
  }

  // create a timestamp
  let time = new Date(+parent.id);

  updateNoteTabTime(time, stickyTab);
}

function updateNoteTabTime(time, tab) {
  let ymdDate = `${time.getMonth() + 1}/${time.getDate()}/${time.getFullYear()}`
    + `, ${time.getHours()}:${zeroFill(time.getMinutes(), 2)}`;
  tab.querySelector(".date").textContent = "Last Updated: " + ymdDate;

  saveSession();
}


/**
 * Upon invocation, will render a selection of colors for the user to pick.
 * @param {Node} container The container to spawn the colors in. Should be .color-picker-options.
 */
function renderColorPalette(container) {
  let colors = [];
  let extraColors = ["gray", "white"];

  // get all colors into an array.
  for (let i = 0; i < 6; i++) {
    let hsl = `hsl(${i * 30}, ${100}%, ${75}%)`;
    colors.push(hsl);
  }
  colors.push(...extraColors);

  for (let color of colors) {
    let pickerChoice = document.createElement("div");
    pickerChoice.classList.add("color-picker-choice");
    pickerChoice.style.backgroundColor = color;
    pickerChoice.addEventListener("click", changeStickyColor);
    container.appendChild(pickerChoice);
  }
}

function changeStickyColor(e) {
  console.log("changeStickyColor");
  let hue = e.currentTarget.style.backgroundColor;
  let parent = e.currentTarget;
  let id;
  while (parent.tagName.toLowerCase() != "article") {
    parent = parent.parentNode;
  }
  id = parent.id;


  parent.style.backgroundImage = `linear-gradient(hsl(315, 0%, 90%), ${hue})`;
  console.log(parent.style.backgroundImage);

  // Send color update to the note tracker too.
  notesList.querySelector(`#tab-${id}`).style.borderTop = "5px solid";
  notesList.querySelector(`#tab-${id}`).style.borderTopColor = hue;
}

function toggleColorPalette(e) {
  let parent = getStickyParentNode(e);
  parent.querySelector(".color-picker-options").classList.toggle("hide");
}

function toggleStickyMenu(e) {
  let parent = getStickyParentNode(e);

  e.currentTarget.querySelector("i").classList.toggle("menu-opened");

  parent.querySelector(".toolbar").classList.toggle("slide-in-out");
}

function getStickyParentNode(event) {
  let parent = event.currentTarget;
  while (parent.tagName.toLowerCase() != "article") {
    parent = parent.parentNode;
  }
  return parent;
}


function renderBackgroundMenu() {
  let backgrounds = document.querySelectorAll("#background-selection > button");

  backgrounds = Array.from(backgrounds);

  for(let i = 0; i < backgrounds.length; i++) {
    backgrounds[i].style.backgroundImage = `url("bg/0${i+1}.jpg")`
    backgrounds[i].style.backgroundPosition = "center";
    backgrounds[i].style.backgroundSize = "cover";
    backgrounds[i].addEventListener("click", e => {
      let img = e.currentTarget.style.backgroundImage;
      document.querySelector("body").style.backgroundImage = img;
      document.querySelector("body").style.backgroundSize = "cover";
    });
  }
}

function saveSession() {
  let allStickyNoteNodes = document.querySelectorAll(".sticky-note:not([id^=sample])");
  let allStickyNoteTabNodes = document.querySelectorAll("[id^=tab]");
  let stickyNotes = [];
  let stickyNoteTabs = [];

  if (allStickyNoteNodes === null || allStickyNoteNodes.length === 0) {
    return;
  }

  for (let i = 0; i < allStickyNoteTabNodes.length; i++) {
    let note = new Note();
    let tab = new Tab();
    let noteNode = allStickyNoteNodes.item(i);
    let tabNode = allStickyNoteTabNodes.item(i);

    // save id, title, priority, color, size, offset, text content, and last updated time.
    note.id = noteNode.id;
    note.title = noteNode.querySelector(".title-edit").value;
    note.priority = noteNode.querySelector(".priority-label").value;
    note.color = noteNode.style.backgroundImage;
    note.size.width = noteNode.style.width;
    note.size.height = noteNode.style.height;
    note.offset.x = noteNode.style.left;
    note.offset.y = noteNode.style.top;
    note.textContent = noteNode.querySelector(".text-content").value;
    note.zIndex = noteNode.style.zIndex;
    // now save it for the tab.
    tab.id = tabNode.id;
    tab.color = tabNode.style.borderTop;
    tab.title = tabNode.querySelector(".tab-title").textContent;
    tab.priority.text = tabNode.querySelector(".note-priority").textContent;
    tab.priority.color = tabNode.querySelector(".note-priority").style.color;
    tab.date = tabNode.querySelector(".date").textContent;

    // note: only have to run json.stringify once. Arrays of objects ocnverted into strings.
    stickyNotes.push(note);
    stickyNoteTabs.push(tab);
  }
  console.log("Array complete");

  localStorage.setItem("stickies", JSON.stringify(stickyNotes));
  localStorage.setItem("tabs", JSON.stringify(stickyNoteTabs));
  localStorage.setItem("bg", document.querySelector("body").style.backgroundImage);

  document.querySelector('#save-message').classList.add("unhide");
  setTimeout(() => document.querySelector('#save-message').classList.remove("unhide"), 3000);
}

function restoreSession() {
  let allStickyNotes = localStorage.getItem("stickies");
  let allStickyNoteTabs = localStorage.getItem("tabs");
  let bg = localStorage.getItem("bg");

  if ((allStickyNotes === null || allStickyNoteTabs === null)) {
    return;
  }

  if (bg !== null && bg !== "") {
    document.querySelector("body").style.backgroundImage = bg;
    document.querySelector("body").style.backgroundSize = "cover";
  }

  allStickyNotes = JSON.parse(allStickyNotes);
  allStickyNoteTabs = JSON.parse(allStickyNoteTabs);

  //allStickyNoteTabs = sortTabsByDate(allStickyNoteTabs);
  for (let i = 0; i < allStickyNotes.length; i++) {
    restoreStickyNote(allStickyNotes[i], allStickyNoteTabs[i]);
  }

}

function sortTabs(e){
  let tabs = Array.from(notesList.children);
  let sortType = e.currentTarget.getAttribute("data-sorttype")
  let sortValues;
  let sortTextLabel = e.currentTarget.textContent.toLowerCase();
  let reverseSort;

  switch(sortType){
    case "date":
      reverseSort = sortTextLabel.includes("newest") ? true : false;
      sortValues = determineSortValue(reverseSort);
      tabs.sort((a, b) => {
        a = a.querySelector(".date").textContent.split(": ")[1];
        b = b.querySelector(".date").textContent.split(": ")[1];
        if (Date.parse(a) > Date.parse(b)){
          return sortValues.before;
        } else {
          return sortValues.after;
        }
      }); 
      break;
    case "name":
      reverseSort = sortTextLabel.includes("z-a") ? true : false;
      sortValues = determineSortValue(reverseSort);
      tabs.sort((a, b) => {
        a = a.querySelector(".tab-title").textContent;
        b = b.querySelector(".tab-title").textContent;
        return (a > b) ? sortValues.before : sortValues.after;
      });
      break;
    case "priority":
      reverseSort = sortTextLabel.includes("most important") ? true : false;
      sortValues = determineSortValue(reverseSort);
      tabs.sort((a, b) => {
        a = a.querySelector(".note-priority").textContent;
        b = b.querySelector(".note-priority").textContent;
        let aStars = a.match(/★/g) === null ? 0 : a.match(/★/g).length;
        let bStars = b.match(/★/g) === null ? 0 : b.match(/★/g).length;
        return (aStars > bStars) ? sortValues.before : sortValues.after;
      });
      break;
    default:
      console.log("Could not run this sort functionality.");
  }

  tabs.forEach(tab => notesList.appendChild(tab));

  // hide the menu after we finish the sort.
  document.querySelector("#sort-options").classList.add("hide");

  function determineSortValue(ascending=false) {
    let after;
    let before;
    if(ascending === false) {
      after = -1;
      before = 1;
    } else {
      after = 1;
      before = -1;
    }

    return {before, after,};
  }
}

function restoreStickyNote(note, tab) {
  let noteNode = defaultSticky.cloneNode(true);
  let tabNode = document.querySelector("#sample-sticky-note-tab").cloneNode(true);

  // fill note node with existing information
  noteNode.id = note.id;
  noteNode.querySelector(".title-edit").value = note.title;
  noteNode.querySelector(".priority-label").value = note.priority;
  noteNode.style.backgroundImage = note.color;
  noteNode.style.width = note.size.width;
  noteNode.style.height = note.size.height;
  noteNode.style.left = note.offset.x;
  noteNode.style.top = note.offset.y;
  noteNode.querySelector(".text-content").value = note.textContent;
  noteNode.style.zIndex = note.zIndex;
  // fill tab node with existing information
  tabNode.id = tab.id;
  tabNode.style.borderTop = tab.color;
  tabNode.querySelector(".tab-title").textContent = tab.title;
  tabNode.querySelector(".note-priority").textContent = tab.priority.text;
  tabNode.querySelector(".note-priority").style.color = tab.priority.color;
  tabNode.querySelector(".date").textContent = tab.date;

  // add the note and tab to the view
  bulletinStickies.appendChild(noteNode);
  notesList.append(tabNode);

  // assign functionalities.
  assignStickyFunctionality(noteNode, true);
  assignTabFunctionality(tabNode);
}

function main() {

  restoreSession();

  document.querySelector("#sort-button").addEventListener("click", (e) =>{
    document.querySelector("#sort-options").classList.toggle("hide");
  });

  notesList.addEventListener("click", (e) => {
    document.querySelector("#sort-options").classList.add("hide");

  });

  document.querySelectorAll("#sort-options > button").forEach(button => {
    button.addEventListener("click", sortTabs)
  });

  // floating menu
  document.querySelector(".toggle-menu-button").addEventListener("click", toggleStickyMenu);
  document.querySelector("#add-sticky-button").addEventListener("click", addStickyNote);
  document.querySelector("#change-bg-button").addEventListener("click", e => {
    document.querySelector("#background-menu").classList.toggle("hide-no-display");
  });

  renderBackgroundMenu();

  window.addEventListener("beforeunload", saveSession);
}

main();