Stream = require('node-rtsp-stream')
stream = new Stream({
	name: 'name',
	streamUrl: 'rtsp://admin:1234@192.168.0.101:554/stream0',
	wsPort: 9999,
	ffmpegOptions: {
		'-stats': '',
		'-r': 30,
		'-f': 'mpeg1video'
	}
})

