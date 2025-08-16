// DOM yüklendikten sonra başlat
window.addEventListener("DOMContentLoaded", () => {

  const overlay = document.getElementById("overlay");
  const scoreBoard = document.getElementById("scoreBoard");
  const startText = document.getElementById("startText");

  let scene, camera, renderer;
  let player = null;
  let mixer;
  let animations;
  let clock = new THREE.Clock();
  let gameStarted = false;
  let score = 0;

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

      // Ground
      const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(20, 100),
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
              
              player.position.set(0, 0, 0); 
              player.rotation.y = Math.PI;
              player.scale.set(1, 1, 1);
              scene.add(player);

              animations = gltf.animations;
              if (animations && animations.length) {
                  mixer = new THREE.AnimationMixer(player);
              }
              
              // Modeli yükledikten sonra animate döngüsünü başlat
              // Bu sayede oyun ekranı yüklenir yüklenmez animasyon oynatabiliriz
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

  // Başlangıçta sadece sahnemizi başlat
  init();

  // ----------------- Oyun Başlatma Mantığı -----------------
  overlay.addEventListener("click", () => {
      // Overlay'i gizle
      overlay.style.display = "none";
      
      // Dance animasyonunu bul ve oynat
      const danceClip = animations.find(clip => clip.name === 'dance');
      if (danceClip) {
          const action = mixer.clipAction(danceClip);
          action.setLoop(THREE.LoopOnce); // Animasyon sadece bir kez oynatılacak
          action.clampWhenFinished = true; // Bittiğinde son karede dur
          action.play();
      } else {
          console.error('dance animasyonu bulunamadı.');
      }

      // 4 saniye sonra oyunu başlat
      setTimeout(() => {
          startGame();
      }, 4000);
  });

  // ----------------- Oyun Başlatma Fonksiyonu -----------------
  function startGame() {
      // Koşma animasyonuna geçiş yap
      const walkProudClip = animations.find(clip => clip.name === 'walk_proud');
      if (walkProudClip) {
          mixer.stopAllAction(); // Önceki animasyonları durdur
          const action = mixer.clipAction(walkProudClip);
          action.setLoop(THREE.LoopRepeat); // Sonsuz döngüde tekrar et
          action.play();
          // Animasyon hızını başlangıçta 2'ye ayarla
          mixer.timeScale = 2;
      }

      // Skoru sıfırla ve oyunu başlat
      score = 0;
      gameStarted = true;
  }

  // ----------------- Animate -----------------
  function animate() {
      requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      if (mixer) {
          if (gameStarted) {
            // Animasyon hızını yavaştan başlatmak yerine 2'den başlat ve 4'e kadar artır
            mixer.timeScale = Math.min(4, mixer.timeScale + delta * 0.05); 
          }
          mixer.update(delta);
      }
      
      renderer.render(scene, camera);
      
      if (!gameStarted || !player) {
          return;
      }
      
      // Animasyonun pozisyon değişimini her karede sıfırlıyoruz
      player.position.set(0, 0, 0);
      player.rotation.y = Math.PI;

      // Your game logic goes here
      score++;
      scoreBoard.innerText = `Score: ${score}`;
  }
});