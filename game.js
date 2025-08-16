loader.load(
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf',
    function (gltf) {
        const model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        model.position.set(0, 0, 0);
        scene.add(model);
        console.log('Örnek model yüklendi:', model);
        scene.remove(cube); // Kırmızı küpü kaldır
    },
    function (xhr) {
        console.log('Yükleme ilerlemesi: ' + (xhr.loaded / xhr.total * 100) + '%');
    },
    function (error) {
        console.error('Örnek model yükleme hatası:', error);
    }
);