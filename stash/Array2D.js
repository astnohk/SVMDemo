"use strict";

class Array2D extends Array {
	constructor(W, H) {
		if (typeof W !== "undefined" && typeof H !== "undefined") {
			super(W * H);
			this.width = W;
			this.height = H;
			this.size = W * H;
			for (let n = 0; n < this.size; n++) {
				this[n] = 0;
			}
		} else {
			super();
			this.width = 0;
			this.height = 0;
			this.size = 0;
		}
	}

	get(x, y)
	{
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
			return null;
		}
		return this[this.width * y + x];
	}

	set(x, y, value)
	{
		if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
			return null;
		}
		this[this.width * y + x] = value;
	}
}

