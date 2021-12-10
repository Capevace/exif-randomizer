const path = require('path');
const { utimes } = require('utimes');
const fs = require('fs/promises');
const Confirm = require('prompt-confirm');
const exiftool = require('node-exiftool');

const ep = new exiftool.ExiftoolProcess();
 
// ep
//   .open()
//   .then(() => ep.writeMetadata('destination.jpg', {
// 	all: '', // remove existing tags
// 	comment: 'Exiftool rules!',
// 	'Keywords+': [ 'keywordA', 'keywordB' ],
//   }, ['overwrite_original']))
//   .then(console.log, console.error)
//   .then(() => ep.close())
//   .catch(console.error)

async function main() {
	try {
		let index = process.argv.indexOf('--input');

		if (index === -1) {
			console.error('Pass a directory to randomize with `node randomize --input <DIR_PATH>`');
			process.exit(1);
		}

		const dir = process.argv[++index];

		if (!dir) {
			console.error('Pass a directory to randomize with `node randomize --input <DIR_PATH>`');
			process.exit(1);
		}

		const fullDir = path.resolve(process.cwd(), dir);

		console.log(`Reading directory: ${fullDir}`);
		const files = await fs.readdir(fullDir);

		console.log(`Found ${files.length} files`);
		const shouldContinue = await (new Confirm('Do you really want to update EXIF data on these files?').run());

		if (!shouldContinue) {
			process.exit(0);
		}

		await ep.open();

		process.on('SIGINT', async () => {
			console.log('Stopping process...');
			await ep.close();
			process.exit(0);
		});

		for (const file of files) {
			await randomizeFile(ep, path.join(fullDir, file));
		}

		await ep.close();
	} catch (e) {
		console.error(e);
	}
}

async function randomizeFile(ep, file) {
	const { dateString, date } = randomDate();

	// Random Area around Lüneburg, inkl. Hamburg
	const lat = 52.923 + (Math.random() * 0.951); 
	const long = 10.405 + (Math.random() * 0.926);
	const dmsLat = convertDDToDMS(lat, false);
	const dmsLong = convertDDToDMS(long, true);

	try {
		await ep.writeMetadata(
			file,
			{
				'DateTime': dateString,
				'DateTimeOriginal': dateString,
				'CreateDate': dateString,
				'ModifyDate': dateString,
				"OffsetTime": "+01:00",
				"OffsetTimeOriginal": "+01:00",
				"OffsetTimeDigitized": "+01:00",
				"latitude": lat,
				"longitude": long,
				'GPSLatitude': `${dmsLat.deg} ${dmsLat.min} ${dmsLat.sec}`,
				'GPSLatitudeRef': lat < 0 ? 'S' : 'N', //dmsLat.dir,
				'GPSLongitude': `${dmsLong.deg} ${dmsLong.min} ${dmsLong.sec}`,
				'GPSLongitudeRef': long < 0 ? 'W' : 'E'
			}, 
			['overwrite_original']
		);

		await fs.utimes(file, date, date);

		console.log(`Changed EXIF dates to '${date.toISOString()}' & '${`${dmsLong.deg} ${dmsLong.min} ${dmsLong.sec}`}'for file '${file}'`);
	} catch (e) {
		console.error(`Error with file '${file}':`, e);
	}
}

function randomDate() {
	const year = 2019 + Math.round(Math.random() * 2);
	const thisYear = year === 2021;

	const month = String(Math.ceil(Math.random() * (thisYear ? 11 : 12)));
	const date = String(Math.ceil(Math.random() * 28));
	const hour = String(Math.round(Math.random() * 23));
	const minutes = String(Math.round(Math.random() * 59));
	const seconds = String(Math.round(Math.random() * 59));

	return {
		dateString: `${year}:${month.padStart(2, '0')}:${date.padStart(2, '0')} ${hour.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`,
		date: new Date(`${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')} ${hour.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}+0100`)
	};
}

// https://stackoverflow.com/questions/5786025/decimal-degrees-to-degrees-minutes-and-seconds-in-javascript
function convertDDToDMS(degFloat, lng){
	var degAbs = Math.abs(degFloat);
    var minFloat = degAbs % 1 * 60;
    var secFloat = minFloat % 1 * 60;
    var deg = Math.floor(degAbs);
    var min = Math.floor(minFloat);
    var sec = secFloat.toFixed(2);

    return {
        dir : degFloat < 0
        	? lng
        		? 'W' 
        		: 'S'
        	: lng
        		? 'E'
        		: 'N',
        deg,
        min,
        sec
    };

    //[deg, 1], [min, 1], [sec, 100]];

	const M=0|(D%1)*60e7;

    return {
        dir : D < 0
        	? lng
        		? 'W' 
        		: 'S'
        	: lng
        		? 'E'
        		: 'N',
        deg : 0|(D<0?D=-D:D),
        min : 0|M/1e7,
        sec : (0|M/1e6%1*6e4)/100
    };
}




// console.log(convertDDToDMS(52.212312112));
main();

// console.log(new Array(300).fill(null).map(x => randomDate()));

/*
{
  "Make": "Samsung",
  "Model": "Galaxy S4 mini",
  "ModifyDate": <Date 2019-10-14T21:19:36.000Z>,
  "YCbCrPositioning": 1,
  "ExposureTime": 0.04,
  "FNumber": 1.8,
  "ExposureProgram": "Normal program",
  "ISO": 800,
  "ExifVersion": "2.2.1",
  "DateTimeOriginal": <Date 2019-10-14T21:19:36.000Z>,
  "CreateDate": <Date 2019-10-14T21:19:36.000Z>,
  "OffsetTime": "+02:00",
  "OffsetTimeOriginal": "+02:00",
  "OffsetTimeDigitized": "+02:00",
  "ComponentsConfiguration": <Uint8Array 01 02 03 00>,
  "ShutterSpeedValue": 4.643964396439644,
  "ApertureValue": 1.6959938128383605,
  "BrightnessValue": -0.884426279884457,
  "ExposureCompensation": 0,
  "MeteringMode": "Pattern",
  "Flash": "Flash did not fire, auto mode",
  "FocalLength": 4.25,
  "SubjectArea": <Uint16Array 02a7 06dd 03df 03df>,
  "SubSecTimeOriginal": "268",
  "SubSecTimeDigitized": "268",
  "FlashpixVersion": "1.0",
  "ColorSpace": 65535,
  "ExifImageWidth": 3024,
  "ExifImageHeight": 4032,
  "SensingMethod": "One-chip color area sensor",
  "SceneType": "Directly photographed",
  "CustomRendered": "Portrait HDR",
  "ExposureMode": "Auto",
  "WhiteBalance": "Auto",
  "FocalLengthIn35mmFormat": 26,
  "SceneCaptureType": "Standard",
  "LensInfo": [1.5399999618512084, 4.25, 1.8, 2.4],
  "LensMake": "Apple",
  "LensModel": "iPhone 11 back dual wide camera 4.25mm f/1.8",
  "GPSLatitudeRef": "N",
  "GPSLatitude": [53, 51, 25.11],
  "GPSLongitudeRef": "E",
  "GPSLongitude": [10, 43, 58.33],
  "GPSAltitudeRef": <Uint8Array 00>,
  "GPSAltitude": 9.156128910310935,
  "GPSSpeedRef": "K",
  "GPSSpeed": 1.2232732776435662,
  "GPSImgDirectionRef": "T",
  "GPSImgDirection": 44.76925279129688,
  "GPSDestBearingRef": "True North",
  "GPSDestBearing": 44.76925279129688,
  "GPSDateStamp": "2019:10:14",
  "GPSHPositioningError": 39.77826270589892,
  "latitude": 53.856975,
  "longitude": 10.732869444444445
}
*/