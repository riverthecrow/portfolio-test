document.addEventListener('DOMContentLoaded', function() {
    // Debugging setup
    const errorDisplay = document.getElementById('error');
    
    try {
        // Verify libraries are loaded
        if (!window.THREE || !window.CANNON) {
            throw new Error("Required libraries (Three.js or Cannon.js) failed to load");
        }

        // Basic scene setup
        const container = document.getElementById('container');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        
        // Add axes helper to verify scene
        const axesHelper = new THREE.AxesHelper(10);
        scene.add(axesHelper);
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 30, 50);
        camera.lookAt(0, 0, 0);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        
        // Simple gear creation function (for debugging)
        function createTestGear() {
            const geometry = new THREE.CylinderGeometry(5, 5, 2, 16);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const gear = new THREE.Mesh(geometry, material);
            gear.rotation.x = Math.PI / 2;
            return gear;
        }
        
        // Debug button functionality
        document.getElementById('add-gear').addEventListener('click', function() {
            try {
                console.log("Add Gear button clicked"); // Verify click works
                
                const testGear = createTestGear();
                scene.add(testGear);
                console.log("Gear added to scene:", testGear); // Verify creation
                
                // Simple animation loop for debugging
                function animate() {
                    requestAnimationFrame(animate);
                    testGear.rotation.z += 0.01;
                    renderer.render(scene, camera);
                }
                animate();
                
            } catch (e) {
                errorDisplay.textContent = "Error adding gear: " + e.message;
                console.error(e);
            }
        });
        
    } catch (e) {
        errorDisplay.textContent = "Initialization error: " + e.message;
        console.error(e);
    }
});
