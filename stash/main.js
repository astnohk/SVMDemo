window.addEventListener("load", initSystem, false);

var SystemRoot;
var SVMWindow;
var SVMApplication;

function
initSystem()
{
	SystemRoot = new ECMASystem(document.body);

	SVMWindow = SystemRoot.createWindow({id: "SVM", noCloseButton: null});
	SVMWindow.ECMASystemWindowFixed = true;
	SVMWindow.style.position = "absolute";
	SVMWindow.style.top = "0px";
	SVMWindow.style.left = "0px";
	SVMWindow.style.width = "100%";
	SVMWindow.style.height = "100%";
	SVMWindow.style.padding = "0";
	SVMWindow.style.outline = "0";
	SVMWindow.style.border = "0";
	SVMWindow.style.backgroundColor = "rgba(20, 20, 20, 0.5)";
	document.body.appendChild(SVMWindow);
	SystemRoot.windowScroller.style.display = "none";

	SVMApplication = new SVM(SystemRoot, SVMWindow);
}

