const video = document.getElementById("video");

const loadLabels = async () => {
  const labels = ["Henrique_Baeta", "Joao", "Thatiane"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let index = 1; index <= 2; index++) {
        const img = await faceapi.fetchImage(`./images/${label}/${index}.png`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
};

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
]).then(startVideo);

async function startVideo() {
  console.log("Video started");
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("play", async () => {
  let recognized = false;
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };

  faceapi.matchDimensions(canvas, displaySize);

  const labels = await loadLabels();

  const referenceFace = await faceapi.fetchImage(
    "./images/Henrique_Baeta/1.png"
  );
  // document.body.append(referenceFace);

  const detection = await faceapi.detectAllFaces(
    referenceFace,
    new faceapi.TinyFaceDetectorOptions()
  );

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      // .withFaceExpressions()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    const faceMatcher = new faceapi.FaceMatcher(labels, 0.6);

    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    results.forEach((result, index) => {
      const box = resizedDetections[index].detection.box;
      const { label, distance } = result;
      new faceapi.draw.DrawTextField(
        [`${label} (${distance.toFixed(2)})`],
        box.bottomLeft
      ).draw(canvas);


      if (label != "unknown") {
        console.log("Pessoa identificada!");
        recognized = true;
        document.body.style.backgroundColor = "green";
      }
      else {
        recognized = false;
        document.body.style.backgroundColor = "red";
      }
    });
  }, 500);

});
