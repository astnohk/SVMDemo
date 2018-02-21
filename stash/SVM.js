// The code written in BSD/KNF indent style
"use strict";

class Console {
	constructor(Screen)
	{
		this.screen = Screen;
		this.lines = [];
		this.lineMax = 100;
	}

	write(text)
	{
		this.lines.push(text);
		if (this.lines.length > this.lineMax) {
			this.lines.shift();
		}
		let display = "";
		for (let l = 0; l < this.lines.length; l++) {
			display = display + this.lines[this.lines.length - 1 - l] + "\n";
		}
		this.screen.innerText = display;
	}
}

class SVM {
	constructor(windowSystemRoot, rootWindow)
	{
		this.SysRoot = windowSystemRoot;
		this.rootWindow = rootWindow;
		this.rootWindow.style.overflow = "hidden";
		this.rootWindow.rootInstance = this;
		this.rootWindowStyle = window.getComputedStyle(this.rootWindow);

		this.trainButton = null;
		this.timeCounter = null;
		this.timeCounterLabel = null;
		this.dataNum = null;
		this.dataNumLabel = null;
		this.inputNum = null;
		this.inputNumLabel = null;
		this.screen = null;
		this.canvas = null;

		this.console = null;

		this.context = null;
		this.canvasSize = {width: 600, height: 600};
		this.canvasOffset = {top: 120, left: 70};
		this.plotOffset = {x: this.canvasSize.width / 2, y: this.canvasSize.height / 2};
		this.plotScale = 4.0;

		this.data = [];
		this.input = []; // data which is not used for training
		this.weight = [];
		this.bias = 0;
		this.lambda = [];
		this.trainEnabled = 0;

		this.loopInterval = null;

		// Initialize
		this.init();
	}

	// ----- Initialize -----
	init()
	{
		// Create UI parts
		this.prepareTools();

		// Initialize
		this.initField();
		this.initSVM();

		// Start loop
		if (this.loopInterval == null) {
			let root = this;
			this.loopInterval = setInterval(function () { root.loop(); }, 25);
		}

		// Set random data
		this.addRandomTrainingData();
	}

	reinit()
	{
		this.console.write("Reset");
		// Initialize
		this.initField();
		this.initSVM();

		// Set random data
		this.addRandomTrainingData();
	}

	prepareTools()
	{
		this.trainButton = document.createElement("div");
		this.trainButton.rootInstance = this;
		this.trainButton.innerHTML = "train";
		this.trainButton.id = "SVMTrainButton";
		this.trainButton.addEventListener("mousedown", function (e) { e.preventDefault(); e.currentTarget.rootInstance.trainEnable(e); }, false);
		this.trainButton.addEventListener("touchstart", function (e) { e.preventDefault(); e.currentTarget.rootInstance.trainEnable(e); }, false);
		this.rootWindow.appendChild(this.trainButton);

		this.resetButton = document.createElement("div");
		this.resetButton.rootInstance = this;
		this.resetButton.innerHTML = "reset";
		this.resetButton.id = "SVMResetButton";
		this.resetButton.addEventListener("mousedown", function (e) { e.preventDefault(); e.currentTarget.rootInstance.reinit(e); }, false);
		this.resetButton.addEventListener("touchstart", function (e) { e.preventDefault(); e.currentTarget.rootInstance.reinit(e); }, false);
		this.rootWindow.appendChild(this.resetButton);

		this.timeCounter = document.createElement("div");
		this.timeCounter.innerHTML = "0";
		this.timeCounter.id = "SVMTimeCounter";
		this.rootWindow.appendChild(this.timeCounter);
		this.timeCounter.addEventListener("mousedown", (e) => console.log(this), false);

		this.timeCounterLabel = document.createElement("div");
		this.timeCounterLabel.innerHTML = "time";
		this.timeCounterLabel.id = "SVMTimeCounterLabel";
		this.rootWindow.appendChild(this.timeCounterLabel);

		this.dataNum = document.createElement("div");
		this.dataNum.rootInstance = this;
		this.dataNum.id = "SVMCellsRow";
		this.rootWindow.appendChild(this.dataNum);

		this.inputNum = document.createElement("div");
		this.inputNum.rootInstance = this;
		this.inputNum.id = "SVMCellsCol";
		this.rootWindow.appendChild(this.inputNum);

		this.dataNumLabel = document.createElement("div");
		this.dataNumLabel.innerHTML = "training data";
		this.dataNumLabel.id = "SVMTrainDataNumLabel";
		this.rootWindow.appendChild(this.dataNumLabel);

		this.inputNumLabel = document.createElement("div");
		this.inputNumLabel.innerHTML = "input";
		this.inputNumLabel.id = "SVMDataNumLabel";
		this.rootWindow.appendChild(this.inputNumLabel);

		this.screen = document.createElement("div");
		this.screen.id = "SVMConsole";
		this.screen.innerHTML = ">";
		this.rootWindow.appendChild(this.screen);
		this.console = new Console(this.screen);

		this.prepareCanvas();
	}

	prepareCanvas()
	{
		this.canvas = document.createElement("canvas");
		this.canvas.rootInstance = this;
		this.canvas.id = "SVMCanvas";
		this.canvas.style.width = this.canvasSize.width + "px";
		this.canvas.style.height = this.canvasSize.height + "px";
		this.canvas.width = this.canvasSize.width;
		this.canvas.height = this.canvasSize.height;
		this.canvas.style.position = "absolute";
		this.canvas.style.top = this.canvasOffset.top + "px";
		this.canvas.style.left = this.canvasOffset.left + "px";
		this.canvas.addEventListener(
		    "windowdrag",
		    function (e) {
			    let style = window.getComputedStyle(e.currentTarget);
			    e.currentTarget.width = parseInt(style.width, 10);
			    e.currentTarget.height = parseInt(style.height, 10);
			    let root = e.currentTarget.rootInstance;
			    root.displayOffset.x = e.currentTarget.width / 2.0;
			    root.displayOffset.y = e.currentTarget.height / 2.0;
		    }, false);
		this.context = this.canvas.getContext("2d");
		this.canvas.addEventListener("mousedown", function (e) { e.currentTarget.rootInstance.canvasMouseClick(e); }, false);
		this.canvas.addEventListener("mousemove", function (e) { e.currentTarget.rootInstance.canvasMouseMove(e); }, false);
		this.canvas.addEventListener("touchstart", function (e) { e.currentTarget.rootInstance.canvasMouseClick(e); }, false);
		this.canvas.addEventListener("touchmove", function (e) { e.currentTarget.rootInstance.canvasMouseMove(e); }, false);
		this.rootWindow.appendChild(this.canvas);
	}

	initField()
	{
		// data used for training and input is just for evaluation
		this.data = [];
		this.input = [];
		this.weight = null;
		this.bias = 0;
		this.lambda = null;
	}

	initSVM()
	{
		this.dim = 2; // SVM input dimension
		// weight
		this.weight = new Array2D(this.dim, 1);
		for (let n = 0; n < this.weight.length; n++) {
			this.weight[n] = 0;
		}
		// bias
		this.bias = 0;
	}


	// Main loop
	loop()
	{
		if (this.trainEnabled == 1) {
			this.train();
		}
		this.draw();
	}

	trainEnable(e)
	{
		this.trainEnabled = (this.trainEnabled + 1) % 2;
		if (this.trainEnabled) {
			this.console.write("Training start");
		} else {
			this.console.write("Training stop");
		}
	}


	// ----- SVM -----
	addRandomTrainingData()
	{
		let v_x = (Math.random() - 0.5) * 60;
		let v_y = (Math.random() - 0.5) * 60;
		let w_x = (Math.random() - 0.5) * 60;
		let w_y = (Math.random() - 0.5) * 60;
		for (let i = 0; i < 130; i++) {
			let x = (Math.random() - 0.5) * 30 - 10 * Math.random();
			let y = (Math.random() - 0.5) * 30 - 10 * Math.random();
			if (Math.random() - 0.5 > 0) {
				this.addTrainingData([x + v_x, y + v_y], 1);
			} else {
				this.addTrainingData([x + w_x, y + w_y], -1);
			}
		}
		this.console.write("Add random data");
	}

	addTrainingData(x, c)
	{
		if (x.length != this.dim) {
			console.log("Error: Bad length of data");
			return;
		}
		c = c / Math.abs(c); // should be -1 or 1
		this.data.push({x: x, c: c}); // x (n-dim vector), class
	}

	initLambda()
	{
		this.lambda = new Array(this.data.length);
		for (let i = 0; i < this.data.length; i++) {
			this.lambda[i] = 0.1;
		}
	}

	train()
	{
		let eta = 0.001 / this.data.length;
		let diff = 0;
		if (this.lambda == null || this.lambda.length != this.data.length) {
			this.initLambda();
		}
		let lambda_new = new Array(this.data.length);
		for (let i = 0; i < this.data.length; i++) {
			let sum = 0;
			let sum2 = 0;
			for (let j = 0; j < this.data.length; j++) {
				let x = 0;
				for (let n = 0; n < this.dim; n++) {
					x += this.data[i].x[n] * this.data[j].x[n];
				}
				sum += this.lambda[j] * this.data[i].c * this.data[j].c * x;
				sum2 += this.lambda[j] * this.data[i].c * this.data[j].c;
			}
			lambda_new[i] = this.lambda[i] + eta * (1 - 0.5 * sum - 0.5 * sum2);
		}
		for (let i = 0; i < this.data.length; i++) {
			diff += Math.abs(lambda_new[i] - this.lambda[i]);
			this.lambda[i] = lambda_new[i];
			if (this.lambda[i] < 0) {
				//this.lambda[i] = 0;
			}
			//console.log("lambda[" + i + "]: " + this.lambda[i]);
		}
		let cond = 0;
		for (let i = 0; i < this.data.length; i++) {
			cond += this.lambda[i] * this.data[i].c;
		}
		console.log({lambda_c: cond});
		console.log(diff);
		for (let n = 0; n < this.dim; n++) {
			this.weight[n] = 0;
			for (let i = 0; i < this.data.length; i++) {
				this.weight[n] += this.lambda[i] * this.data[i].c * this.data[i].x[n];
			}
		}
		console.log({w0: this.weight[0], w1: this.weight[1]});
	}


	// Plotting
	draw()
	{
		let drawArea = {left: 0, right: this.canvas.width, top: 0, bottom: this.canvas.height};
		//this.viewModified();
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw cartesian axes
		this.context.lineWidth = 1;
		this.context.strokeStyle = "rgb(130, 130, 130)";
		this.context.beginPath();
		this.context.moveTo(this.plotOffset.x, 0);
		this.context.lineTo(this.plotOffset.x, this.canvas.height);
		this.context.moveTo(0, this.plotOffset.y);
		this.context.lineTo(this.canvas.width, this.plotOffset.y);
		this.context.stroke();

		// Draw w' (w' . w = 0)
		this.context.strokeStyle = "rgb(255, 255, 0)";
		this.context.beginPath();
		this.context.moveTo(this.plotOffset.x, this.plotOffset.y);
		this.context.lineTo(
		    this.plotOffset.x + 10 * this.plotScale * this.weight[0],
		    this.plotOffset.y - 10 * this.plotScale * this.weight[1]);
		this.context.stroke();

		// Plot data
		for (let i = 0; i < this.data.length; i++) {
			if (this.data[i].c > 0) {
				this.context.strokeStyle = "rgb(255, 0, 0)";
			} else {
				this.context.strokeStyle = "rgb(0, 255, 0)";
			}
			this.context.beginPath();
			this.context.arc(
			    this.plotOffset.x + this.plotScale * this.data[i].x[0],
			    this.plotOffset.y - this.plotScale * this.data[i].x[1],
			    1, 0, 2 * Math.PI, false);
			this.context.stroke();
		}
		for (let i = 0; i < this.input.length; i++) {
			this.context.strokeStyle = "rgb(0, 0, 255)";
			this.context.beginPath();
			this.context.arc(
			    this.plotOffset.x + this.plotScale * this.input[i].x[0],
			    this.plotOffset.y - this.plotScale * this.input[i].x[1],
			    1, 0, 2 * Math.PI, false);
			this.context.stroke();
		}
	}

	viewModified()
	{
		let newWindowSize = {x: parseInt(this.rootWindowStyle.width, 10), y: parseInt(this.rootWindowStyle.height, 10)};
		if (this.canvas.width != newWindowSize.x ||
		    this.canvas.height != newWindowSize.y) {
			this.canvas.width = newWindowSize.x;
			this.canvas.height = newWindowSize.y;
			this.displayOffset.x = newWindowSize.x / 2;
			this.displayOffset.y = newWindowSize.y / 2;
		}
	}


	// Event
	canvasMouseClick(e)
	{
	}

	canvasMouseMove(e)
	{
	}
}

