const video = document.getElementById("video");

const run = async () => {
  console.log("running");
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
    faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
    faceapi.nets.faceExpressionNet.loadFromUri("./models"),
  ]);

  //refFace = we KNOW this is Henrique Baeta
  const refFace = await faceapi.fetchImage("./images/eu.png");
  document.body.append(refFace);

  console.log("refFace", refFace);

  // const facesToCheck = await faceapi.fetchImage(
  //   "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/JordanSmithWorthy2.jpg/170px-JordanSmithWorthy2.jpg"
  // );

  console.log("checking");

  const detections = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    // .withFaceLandmarks()
    // .withFaceDescriptors()
    // .withFaceExpressions();

    console.log("detections", detections);

  //we grab the reference image, and hand it to detectAllFaces method
  let refFaceAiData = await faceapi
    .detectAllFaces(refFace, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

    console.log("refFaceAiData", refFaceAiData);

  // let facesToCheckAiData = await faceapi
  //   .detectAllFaces(detections)
  //   .withFaceLandmarks()
  //   .withFaceDescriptors();

  // console.log("here?", faceAIData);

  //get the canvas, and set it on top of the image
  //and make it the same size
  const canvas = document.getElementById("canvas");
  faceapi.matchDimensions(canvas, detections);

  //we need to make a face matcher!!
  //FaceMatcher is a constructor in faceapi
  //we hand it our reference AI data
  let faceMatcher = new faceapi.FaceMatcher(refFaceAiData);
  facesToCheckAiData = faceapi.resizeResults(facesToCheckAiData, detections);

  //loop through all of hte faces in our imageToCheck and compare to our reference datta
  detections.forEach((face) => {
    const { detection, descriptor } = face;
    //make a label, using the default
    let label = faceMatcher.findBestMatch(descriptor).toString();
    console.log(label);
    if (label.includes("unknown")) {
      return;
    }
    let options = { label: "Jordan" };
    const drawBox = new faceapi.draw.DrawBox(detection.box, options);
    drawBox.draw(canvas);
  });
};

run();
