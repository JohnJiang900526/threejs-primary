import init from './index';

self.onmessage = function (message) {
	const data = message.data;
	const canvas = data.drawingSurface as THREE.OffscreenCanvas;
	const width = data.width as number;
	const height = data.height as number;
	const pixelRatio = data.pixelRatio as number;
	const path = data.path as string;

	init(canvas, width, height, pixelRatio, path);
};


