// The code written in BSD/KNF indent style
"use strict";

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
		this.parameterDispBox = null;
		this.weight0Disp = null;
		this.weight1Disp = null;
		this.biasDisp = null;
		this.betaDisp = null;
		this.diffDisp = null;
		this.constraintDisp = null;
		this.screen = null;
		this.canvas = null;

		this.console = null;

		this.context = null;
		this.canvasSize = {width: 600, height: 600};
		this.canvasOffset = {top: 120, left: 70};
		this.plotOffset = {x: this.canvasSize.width / 2, y: this.canvasSize.height / 2};
		this.plotScale = 1.0;

		this.data = [];
		this.supportVectors = [];
		this.input = []; // data which is not used for training
		this.weight = [];
		this.bias = 0;
		this.lambda = [];
		this.beta = 0;
		this.betaMin = 0.01;
		this.diff = 0;
		this.constraint = 0;
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

		// Parameter Display
		this.parameterDispBox = document.createElement("div");
		this.parameterDispBox.id = "SVMParameterDispBox";
		this.rootWindow.appendChild(this.parameterDispBox);

		// weight[0]
		this.weight0Label = document.createElement("div");
		this.weight0Label.className = "SVMParameterLabel";
		this.weight0Label.id = "SVMWeight0Label";
		this.weight0Label.innerHTML = "w0";
		this.parameterDispBox.appendChild(this.weight0Label);

		this.weight0Disp = document.createElement("div");
		this.weight0Disp.className = "SVMParameterDisp";
		this.weight0Disp.id = "SVMWeight0Disp";
		this.parameterDispBox.appendChild(this.weight0Disp);

		// weight[1]
		this.weight1Label = document.createElement("div");
		this.weight1Label.className = "SVMParameterLabel";
		this.weight1Label.id = "SVMWeight1Label";
		this.weight1Label.innerHTML = "w1";
		this.parameterDispBox.appendChild(this.weight1Label);

		this.weight1Disp = document.createElement("div");
		this.weight1Disp.className = "SVMParameterDisp";
		this.weight1Disp.id = "SVMWeight1Disp";
		this.parameterDispBox.appendChild(this.weight1Disp);

		// bias
		this.biasLabel = document.createElement("div");
		this.biasLabel.className = "SVMParameterLabel";
		this.biasLabel.id = "SVMBiasLabel";
		this.biasLabel.innerHTML = "b";
		this.parameterDispBox.appendChild(this.biasLabel);

		this.biasDisp = document.createElement("div");
		this.biasDisp.className = "SVMParameterDisp";
		this.biasDisp.id = "SVMBiasDisp";
		this.parameterDispBox.appendChild(this.biasDisp);

		// beta
		this.betaLabel = document.createElement("div");
		this.betaLabel.className = "SVMParameterLabel";
		this.betaLabel.id = "SVMBetaLabel";
		this.betaLabel.innerHTML = "beta";
		this.parameterDispBox.appendChild(this.betaLabel);

		this.betaDisp = document.createElement("div");
		this.betaDisp.className = "SVMParameterDisp";
		this.betaDisp.id = "SVMBetaDisp";
		this.parameterDispBox.appendChild(this.betaDisp);

		// diff
		this.diffLabel = document.createElement("div");
		this.diffLabel.className = "SVMParameterLabel";
		this.diffLabel.id = "SVMDiffLabel";
		this.diffLabel.innerHTML = "diff";
		this.parameterDispBox.appendChild(this.diffLabel);

		this.diffDisp = document.createElement("div");
		this.diffDisp.className = "SVMParameterDisp";
		this.diffDisp.id = "SVMDiffDisp";
		this.parameterDispBox.appendChild(this.diffDisp);

		// lambda_constraint
		this.constraintLabel = document.createElement("div");
		this.constraintLabel.className = "SVMParameterLabel";
		this.constraintLabel.id = "SVMConstraintLabel";
		this.constraintLabel.innerHTML = "constraint";
		this.parameterDispBox.appendChild(this.constraintLabel);

		this.constraintDisp = document.createElement("div");
		this.constraintDisp.className = "SVMParameterDisp";
		this.constraintDisp.id = "SVMConstraintDisp";
		this.parameterDispBox.appendChild(this.constraintDisp);

		// Init console
		this.console = new Console(this.screen);
		this.screen = this.console.getElement();
		this.screen.id = "SVMConsole";
		this.rootWindow.appendChild(this.screen);

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
		let coeff = 100.0;
		let v_x = (Math.random() - 0.5) * coeff;
		let v_y = (Math.random() - 0.5) * coeff;
		let w_x = (Math.random() - 0.5) * coeff;
		let w_y = (Math.random() - 0.5) * coeff;
		for (let i = 0; i < 60; i++) {
			let x = (Math.random() - 0.5) * 0.5 * coeff;
			let y = (Math.random() - 0.5) * 0.5 * coeff;
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
			this.lambda[i] = (0.5 + 0.5 * Math.random()) / this.data.length;
		}
	}

	train()
	{
		//let eta = 0.0001 / this.data.length;
		if (this.lambda == null || this.lambda.length != this.data.length) {
			this.initLambda();
			this.beta = 0.8;
		}
		let lambda_new = new Array(this.data.length);
		let eta = 0.0002 / this.data.length;
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
			lambda_new[i] = this.lambda[i] + eta * (1.0 - (1.0 - this.beta) * 0.5 * sum - this.beta * 0.5 * sum2);
			//lambda_new[i] = this.lambda[i] + eta * (1.0 - (1.0 - this.beta) * sum - this.beta * sum2);
			//lambda_new[i] = this.lambda[i] + eta * (1.0 - 0.5 * sum);
		}
		let iprod = 0;
		for (let i = 0; i < this.data.length; i++) {
			iprod += lambda_new[i] * this.data[i].c;
		}
		for (let i = 0; i < this.data.length; i++) {
			lambda_new[i] -= 0.01 * this.data[i].c * iprod;
		}
		this.beta *= 0.998;
		this.beta = Math.max(this.betaMin, this.beta);
		this.diff = 0;
		for (let i = 0; i < this.data.length; i++) {
			this.diff += Math.abs(lambda_new[i] - this.lambda[i]);
			this.lambda[i] = lambda_new[i];
			if (this.lambda[i] < 0) {
				this.lambda[i] = 1E-6;
			}
		}

		this.constraint = 0;
		let index_lambda_max = 0;
		let index_lambda_nextmax = 0;
		for (let i = 0; i < this.data.length; i++) {
			if (this.lambda[i] > this.lambda[index_lambda_max]) {
                // Check next_max
                if (this.lambda[index_lambda_max] > this.lambda[index_lambda_next_max]) {
                    index_lambda_nextmax = index_lambda_max;
                }
				index_lambda_max = i;
			}
			this.constraint += this.lambda[i] * this.data[i].c;
		}
		this.bias = 0;
		for (let n = 0; n < this.dim; n++) {
			this.weight[n] = 0;
			for (let i = 0; i < this.data.length; i++) {
				this.weight[n] += this.lambda[i] * this.data[i].c * this.data[i].x[n];
			}
			//this.bias += this.weight[n] * this.data[index_lambda_max].x[n];
			this.bias += 0.5 * this.weight[n]
			    * (this.data[index_lambda_max].x[n] + this.data[index_lambda_nextmax].x[n]);
		}
		//this.bias -= this.data[index_lambda_max].c;
		this.bias -= 0.5 * (this.data[index_lambda_max].c + this.data[index_lambda_nextmax].c);
		this.supportVectors = [index_lambda_max, index_lambda_nextmax];
		this.parameterDisp();
	}

	parameterDisp()
	{
		this.weight0Disp.innerHTML = this.weight[0];
		this.weight1Disp.innerHTML = this.weight[1];
		this.biasDisp.innerHTML = this.bias;
		this.betaDisp.innerHTML = this.beta;
		this.diffDisp.innerHTML = this.diff;
		this.constraintDisp.innerHTML = this.constraint;
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

		// Draw g(x) == 0
		let norm = Math.sqrt(this.weight[0] * this.weight[0] + this.weight[1] * this.weight[1]);
		let v_zero = [
			this.weight[0] * this.bias / norm / norm,
			this.weight[1] * this.bias / norm / norm];
		let v_norm = [-this.weight[1] / norm, this.weight[0] / norm];
		this.context.strokeStyle = "rgb(0, 0, 255)";
		this.context.beginPath();
		this.context.moveTo(
		    this.plotOffset.x + (v_zero[0] + 200 * v_norm[0]) * this.plotScale,
		    this.plotOffset.y + -(v_zero[1] + 200 * v_norm[1]) * this.plotScale);
		this.context.lineTo(
		    this.plotOffset.x + (v_zero[0] - 200 * v_norm[0]) * this.plotScale,
		    this.plotOffset.y + -(v_zero[1] - 200 * v_norm[1]) * this.plotScale);
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
		// Draw circle on Support Vectors
		for (let i = 0; i < this.supportVectors.length; i++) {
			this.context.strokeStyle = "rgb(255, 255, 0)";
			this.context.beginPath();
			this.context.arc(
			    this.plotOffset.x + this.plotScale * this.data[this.supportVectors[i]].x[0],
			    this.plotOffset.y - this.plotScale * this.data[this.supportVectors[i]].x[1],
			    3, 0, 2 * Math.PI, false);
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

