// DOM yüklendikten sonra başlat
window.addEventListener("DOMContentLoaded", () => {

  const overlay = document.getElementById("overlay");
  const scoreBoard = document.getElementById("scoreBoard");

  let scene, camera, renderer;
  let player = null;
  let mixer; // Animasyonları yönetmek için
  let animations; // Modelden gelen tüm animasyon kliplerini saklamak için
  let clock = new THREE.Clock(); // Animasyonun delta zamanını hesaplamak için
  let gameStarted = false;
  let score = 0;
  let selectedCharacter = null;

  // ----------------- Karakter Seçimi -----------------
  document.getElementById("charGreen").addEventListener("click", () => {
      selectedCharacter = "green";
      overlay.style.display = "none";
      startGame();
  });

  document.getElementById("charBlack").addEventListener("click", () => {
      selectedCharacter = "black";
      overlay.style.display = "none";
      startGame();
  });

  // ----------------- Init Scene -----------------
  function init() {
      // Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87ceeb);

      // Camera
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 2, 5);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      // Lights
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 10, 7);
      scene.add(light);
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // Ground
      const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(20, 100),
          new THREE.MeshStandardMaterial({ color: 0x228B22 })
      );
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      // Add Player based on selection
      if (selectedCharacter === "green") {
          // Green Cube
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
          player = new THREE.Mesh(geometry, material);
          player.position.set(0, 0.5, 0);
          scene.add(player);
      } else if (selectedCharacter === "black") {
          // Load Model
          const loader = new THREE.GLTFLoader();
          loader.load(
              'cow_run.glb', 
              (gltf) => {
                  player = gltf.scene;
                  // Başlangıç pozisyonunu ayarlıyoruz
                  player.position.set(0, 0, 0); 
                  player.scale.set(1, 1, 1);
                  scene.add(player);

                  // Animasyonları başlat
                  animations = gltf.animations;
                  if (animations && animations.length) {
                      mixer = new THREE.AnimationMixer(player);
                      const action = mixer.clipAction(animations[0]); 
                      action.play();
                  }
              },
              (xhr) => {
                  console.log((xhr.loaded / xhr.total * 100) + '% loaded');
              },
              (error) => {
                  console.error('An error happened', error);
              }
          );
      }

      window.addEventListener("resize", () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
      });
  }

  // ----------------- Start Game -----------------
  function startGame() {
      init();
      gameStarted = true;
      animate();
  }

  // ----------------- Animate -----------------
  function animate() {
      requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      if (mixer) {
          mixer.update(delta);
      }
      
      renderer.render(scene, camera);
      
      if (!gameStarted || !player) {
          return;
      }
      
      // Animasyonun ileri hareketini iptal et ve ineği yerinde tut
      player.position.z = 0;
      player.position.x = 0; // İneğin sola kaymasını da engeller

      // Your game logic goes here
      score++;
      scoreBoard.innerText = `Score: ${score}`;
  }
});