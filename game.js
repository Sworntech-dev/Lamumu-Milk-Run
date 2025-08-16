// DOM yüklendikten sonra başlat
window.addEventListener("DOMContentLoaded", () => {

  const overlay = document.getElementById("overlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const scoreBoard = document.getElementById("scoreBoard");
  const startButton = document.getElementById("startButton");
  const restartButton = document.getElementById("restartButton");
  const finalScoreText = document.getElementById("finalScoreText");

  let scene, camera, renderer;
  let player = null;
  let mixer;
  let animations;
  let clock = new THREE.Clock();
  let gameStarted = false;
  let gameOver = false;
  let score = 0;
  
  // Şeritler ve pozisyon
  const lanes = [-3, 0, 3];
  let currentLane = 1;
  
  // Nesneleri tutmak için diziler
  const obstacles = [];
  const milkCartons = [];

  // Rastgele nesne oluşturmak için zamanlayıcı
  let spawnTimer = 0;
  const spawnInterval = 1;

  // Klavye Kontrolleri
  window.addEventListener('keydown', (event) => {
    if (!gameStarted || gameOver) return;

    if (event.key === 'a' || event.key === 'A') {
      if (currentLane > 0) {
        currentLane--;
      }
    } else if (event.key === 'd' || event.key === 'D') {
      if (currentLane < lanes.length - 1) {
        currentLane++;
      }
    }
  });

  // ----------------- Init Scene -----------------
  function init() {
      // Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87ceeb);

      // Camera
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 3, 7); 

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

      // Ground (Yol)
      const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(20, 1000),
          new THREE.MeshStandardMaterial({ color: 0x228B22 })
      );
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      // Cow Modelini Yükle
      const loader = new THREE.GLTFLoader();
      loader.load(
          'dancing_cow.glb', 
          (gltf) => {
              player = gltf.scene;
              
              player.position.set(lanes[currentLane], 0, 0); 
              player.rotation.y = Math.PI;
              player.scale.set(1, 1, 1);
              scene.add(player);

              animations = gltf.animations;
              if (animations && animations.length) {
                  mixer = new THREE.AnimationMixer(player);
              }
              
              animate();
          },
          (xhr) => {
              console.log((xhr.loaded / xhr.total * 100) + '% loaded');
          },
          (error) => {
              console.error('An error happened', error);
          }
      );

      window.addEventListener("resize", () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
      });
  }

  // ----------------- Oyun Başlatma Mantığı -----------------
  startButton.addEventListener("click", () => {
      overlay.style.display = "none";
      
      const danceClip = animations.find(clip => clip.name === 'dance');
      if (danceClip) {
          const action = mixer.clipAction(danceClip);
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
          action.play();
      }

      setTimeout(() => {
          startGame();
      }, 4000);
  });

  restartButton.addEventListener("click", () => {
      location.reload();
  });

  // ----------------- Nesne Oluşturma Fonksiyonları -----------------
  function createObstacle() {
      const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const obstacle = new THREE.Mesh(geometry, material);
      
      const laneIndex = Math.floor(Math.random() * lanes.length);
      obstacle.position.set(lanes[laneIndex], 0.75, -50);
      scene.add(obstacle);
      obstacles.push(obstacle);
  }

  function createMilkCarton() {
      const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const milkCarton = new THREE.Mesh(geometry, material);

      const laneIndex = Math.floor(Math.random() * lanes.length);
      milkCarton.position.set(lanes[laneIndex], 0.5, -50);
      scene.add(milkCarton);
      milkCartons.push(milkCarton);
  }

  function spawnObjects() {
      if (Math.random() > 0.5) {
          createObstacle();
      } else {
          createMilkCarton();
      }
  }

  // ----------------- Oyun Başlatma Fonksiyonu -----------------
  function startGame() {
      const walkProudClip = animations.find(clip => clip.name === 'walk_proud');
      if (walkProudClip) {
          mixer.stopAllAction();
          const action = mixer.clipAction(walkProudClip);
          action.setLoop(THREE.LoopRepeat);
          action.play();
          mixer.timeScale = 2;
      }
      
      score = 0;
      gameStarted = true;
      gameOver = false;
      scoreBoard.innerText = `Score: ${score}`;

      spawnObjects();
      setInterval(spawnObjects, 1000);
  }

  // ----------------- Game Over Fonksiyonu -----------------
  function endGame() {
      gameOver = true;
      gameStarted = false;
      mixer.stopAllAction();
      finalScoreText.innerText = `Final Score: ${score}`;
      gameOverOverlay.style.display = "flex";
  }

  // ----------------- Animate -----------------
  function animate() {
      requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      if (mixer) {
          if (gameStarted) {
            mixer.timeScale = Math.min(4, mixer.timeScale + delta * 0.05); 
          }
          mixer.update(delta);
      }
      
      if (player && !gameOver) {
          const targetX = lanes[currentLane];
          player.position.x += (targetX - player.position.x) * 0.1;
      }
      
      renderer.render(scene, camera);
      
      if (!gameStarted || gameOver) {
          return;
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
          const obstacle = obstacles[i];
          obstacle.position.z += mixer.timeScale * 0.1;
          
          if (obstacle.position.z > 5) {
              scene.remove(obstacle);
              obstacles.splice(i, 1);
          }

          if (
              Math.abs(player.position.x - obstacle.position.x) < 1 &&
              Math.abs(player.position.z - obstacle.position.z) < 1
          ) {
              console.log("Game Over! Engelle çarpıştı.");
              endGame();
          }
      }

      for (let i = milkCartons.length - 1; i >= 0; i--) {
          const milkCarton = milkCartons[i];
          milkCarton.position.z += mixer.timeScale * 0.1;

          if (milkCarton.position.z > 5) {
              scene.remove(milkCarton);
              milkCartons.splice(i, 1);
          }

          if (
              Math.abs(player.position.x - milkCarton.position.x) < 1 &&
              Math.abs(player.position.z - milkCarton.position.z) < 1
          ) {
              score += 10;
              scoreBoard.innerText = `Score: ${score}`;
              scene.remove(milkCarton);
              milkCartons.splice(i, 1);
              console.log("Süt toplandı! Skor: " + score);
          }
      }
  }

  init();
});