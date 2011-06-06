var gCanvas;
var gContext;

var allCRCs = new Array();
var currentCRC;

var kKeyboardLeftArrow = 37;
var kKeyboardUpArrow = 38;
var kKeyboardRightArrow = 39;
var kKeyboardDownArrow = 40;

var kKeyboardEnter = 13;

var kKeyboardG = 71;
var kKeyboardS = 83;

function CRC(text) {
	this.text = text;
	this.x = 50;
	this.y = 50;

	this.defaultWidth = 80
	this.defaultHeight = 50;
	this.width = this.defaultWidth;
	this.height = this.defaultHeight;

	this.growthMultiplier = 5;
	this.growthInterval = 30;

	this.collaborators = new Array();
	this.responsibilities = new Array();

	this.draw = function() {
		if (this.shrunk()) return this.drawSimple();
		if (this.grown()) return this.drawDetailed();
	}

	this.drawSimple = function() {
		console.log("draw simple for: " + this.text);
		// black outline
		gContext.strokeStyle = "#000";

		// draw the rect
		gContext.strokeRect(this.x, this.y, this.width, this.height);

		gContext.font = "bold 12px sans-serif";
		gContext.fillText(this.text, this.x+10, this.y+20);
	}

	this.drawDetailed = function() {
		console.log("draw detailed for: " + this.text);
		// black outline
		gContext.strokeStyle = "#000";

		// draw the rect
		gContext.strokeRect(this.x, this.y, this.width, this.height);

		gContext.font = "bold 12px sans-serif";
		gContext.fillText("class: " + this.text, this.x+10, this.y+20);

		gContext.beginPath();

		// underline the class name
		gContext.moveTo(this.x+10, this.y+25);
		gContext.lineTo(this.x+210, this.y+25);
		
		this.drawCollaborators();
		this.drawResponsibilities();
	}

	this.drawCollaborators = function() {		
		collaboratorX = this.x+250;
		collaboratorY = this.y+15;

		// seperator 
		gContext.moveTo(collaboratorX, collaboratorY);
		gContext.lineTo(collaboratorX, collaboratorY+200);
		gContext.stroke();

		gContext.fillText("collaborators:", collaboratorX+10, collaboratorY+10);

		currentYOffset = collaboratorY + 30;
		this.collaborators.forEach(
			function(collaborator) {
				// @TODO handle text wrapping
				console.log("writing collaborator: " + collaborator);
				gContext.fillText("-" + collaborator, collaboratorX+10, currentYOffset);
				currentYOffset += 15;
			}
		);
	}

	this.drawResponsibilities = function() {
		responsibilitiesX = this.x+10

		gContext.fillText("responsibilities:", responsibilitiesX, this.y+45);

		currentYOffset = this.y + 65;
		this.responsibilities.forEach(
			function(responsibility) {
				// @TODO handle text wrapping
				console.log("writing responsibility: " + responsibility);
				gContext.fillText("-" + responsibility, responsibilitiesX, currentYOffset);
				currentYOffset += 15;
			}
		);
	}

	this.shrunk = function() {
		return this.width == this.defaultWidth;
	}

	this.grown = function() {
		return this.width == this.defaultWidth * this.growthMultiplier;
	}

	this.grow = function() {
		if (this.grown()) return;

		console.log("growing: " + this.text);
		this.transition(
			function(self) {
				return {width: self.width + self.defaultWidth, 
						height: self.height + self.defaultHeight};
			},
			function(self) { 
				return self.grown() 
			}
		);
	}

	this.shrink = function() {
		if (this.shrunk()) return;

		console.log("shrinking : " + this.text);
		this.transition(
			function(self) {
				return {width: self.width - self.defaultWidth, 
						height: self.height - self.defaultHeight};
			},
			function(self) { 
				return self.shrunk() 
			}
		);
	}

	this.toggle = function() {
		if (this.shrunk()) this.grow();
		if (this.grown()) this.shrink();
	}

	// takes in two functions: one to calculate the next width/height in the step, 
	// the other to determine when we are done
	this.transition = function(dimensionUpdaterDelegate, doneDelegate) {
		// 'self' as alias to 'this' for scoping/closure concerns with setInterval
		var self = this;
		var interval= window.setInterval(function() {
			var newDimensions = dimensionUpdaterDelegate(self);
			self.width = newDimensions.width;
			self.height = newDimensions.height;

			// redraw everything to eliminate damage 
			draw();

			if (doneDelegate(self)) window.clearInterval(interval);
		}, this.growthInterval);
	}

	this.moveRightOf = function(otherCRC) {
		if (otherCRC == null) return;

		this.x = otherCRC.x + otherCRC.width + 10;
		this.y = otherCRC.y;
	}

	this.addResponsibility = function(responsibility) {
		this.responsibilities.push(responsibility);
	}

	this.addCollaborator = function(collaborator) {
		this.collaborators.push(collaborator);
	}
}

function getElementValueAndReset(id) {
	var element = document.getElementById(id);
	var value = element.value;
	element.value = "";
	return value;
}

function newCRC() {
	var crcName = getElementValueAndReset("crc_name");
	var crc = new CRC(crcName);
	if (currentCRC != null)
		crc.moveRightOf(currentCRC);

	currentCRC = crc;
	currentCRC.draw();

	allCRCs.push(currentCRC);
}

function addResponsibility() {
	var responsibility = getElementValueAndReset("crc_responsibility");

	// @TODO validate/sanitize input?
	currentCRC.addResponsibility(responsibility);
	draw();
}

function addCollaborator() {
	var collaborator = getElementValueAndReset("crc_collaborator");

	// @TODO validate/sanitize input?
	currentCRC.addCollaborator(collaborator);
	draw();
}

function keyboardHandler(keyboardEvent) {
	if (currentCRC == null) {
		return;
	}
	
	console.log("handling key: " + keyboardEvent.keyCode);
	switch (keyboardEvent.keyCode) {
		// movement keys
		case kKeyboardLeftArrow:
			currentCRC.x -= 10;
			break;
		case kKeyboardUpArrow:
			currentCRC.y -= 10;
			break;
		case kKeyboardRightArrow:
			currentCRC.x += 10;
			break;
		case kKeyboardDownArrow:
			currentCRC.y += 10;
			break;

		// grow/shrink
		/*
		case kKeyboardG:
			currentCRC.grow();
			return;
		case kKeyboardS:
			currentCRC.shrink();
			return;
		*/

		default:
			return;
	}

	draw();
}

function getCanvasRelativeCoordinates(mouseEvent) {
	var x; 
	var y;
	if (mouseEvent.pageX != undefined && mouseEvent.pageY != undefined) {
		x = mouseEvent.pageX;
		y = mouseEvent.pageY;
	} else {
		x = mouseEvent.clientX + document.body.scrollLeft + 
									document.documentElement.scrollLeft;
		y = mouseEvent.clientY + document.body.scrollTop +
									document.body.scrollTop;
	}

	x -= gCanvas.offsetLeft;
	y -= gCanvas.offsetTop;
	return {x:x, y:y};
}

function findCRCByCoordinates(coordinates) {
	var foundCRC;

	// returned value is the least recently added element for which the 
	// click event falls within its coordinate boundaries
	allCRCs.forEach(function(crc) {
		if (coordinates.x >= crc.x && coordinates.x < crc.x + crc.width &&
			coordinates.y >= crc.y && coordinates.y < crc.y + crc.height) {
			foundCRC = crc;
			return;
		}
	});

	return foundCRC;
}

function mouseHandler(mouseEvent) {
	var coordinates = getCanvasRelativeCoordinates(mouseEvent);
	console.log("got mouse coords: " + coordinates.x + "/" + coordinates.y);

	var selectedCRC = findCRCByCoordinates(coordinates);
	if (selectedCRC == null) return;

	console.log("selected CRC: " + selectedCRC.text);
	// if already selected, toggle it
	if (currentCRC == selectedCRC) {
		currentCRC.toggle();
	}

	currentCRC = selectedCRC;
}

function clearCanvas() {
	// resetting width causes the entire canvas to clear
	gCanvas.width = gCanvas.width;

	// draw a faint outline
	gContext.strokeStyle = "#999";
	gContext.strokeRect(0, 0, gCanvas.width, gCanvas.height);
}

function draw() {
	clearCanvas();

	// redraw everything
	allCRCs.forEach(function(crc) { crc.draw(); })
}

function setup() {
	// get canvas and context
	gCanvas = document.getElementById("crc_canvas");
	gContext = gCanvas.getContext("2d");

	// draw initial outline
	draw();

	// setup event listeners
	window.addEventListener("keydown", keyboardHandler, true);
	gCanvas.addEventListener("click", mouseHandler, true);
}
