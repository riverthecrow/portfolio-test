document.addEventListener('DOMContentLoaded', function() {
    // Physics world setup
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Mild gravity to keep gears on ground
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    
    // Contact material for gear interactions
    const gearMaterial = new CANNON.Material("gearMaterial");
    const gearContactMaterial = new CANNON.ContactMaterial(
        gearMaterial, 
        gearMaterial, 
        {
            friction: 0.3,
            restitution: 0.0,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        }
    );
    world.addContactMaterial(gearContactMaterial);
    
    // Ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);
    
    // Scene setup
    const container = document.getElementById('container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 50);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Variables
    let gears = [];
    let selectedGear = null;
    let mouse = new THREE.Vector2();
    let raycaster = new THREE.Raycaster();
    
    // Gear creation functions
    function createSpurGear(teeth = 12, radius = 5, thickness = 2, color = 0x8888ff) {
        const gearGroup = new THREE.Group();
        
        // Create gear geometry
        const gearGeometry = createGearGeometry(teeth, radius, thickness);
        const gearMaterial = new THREE.MeshPhongMaterial({ color, flatShading: true });
        const gearMesh = new THREE.Mesh(gearGeometry, gearMaterial);
        gearMesh.rotation.x = Math.PI / 2;
        gearMesh.castShadow = true;
        gearGroup.add(gearMesh);
        
        // Physics body
        const gearShape = new CANNON.Cylinder(
            radius * 0.9, // Smaller radius to account for teeth
            radius * 0.9,
            thickness,
            16
        );
        
        const gearBody = new CANNON.Body({
            mass: 1,
            shape: gearShape,
            material: gearMaterial,
            position: new CANNON.Vec3(
                (Math.random() - 0.5) * 10,
                thickness / 2,
                (Math.random() - 0.5) * 10
            ),
            angularVelocity: new CANNON.Vec3(0, 0, 0),
            angularDamping: 0.5
        });
        
        // Add properties to the gear object
        gearGroup.userData = {
            type: 'spur',
            teeth,
            radius,
            thickness,
            color,
            speed: 0.5,
            direction: 1,
            mesh: gearMesh,
            body: gearBody,
            connections: [],
            isDriver: false
        };
        
        world.addBody(gearBody);
        return gearGroup;
    }
    
    function createBevelGear(teeth = 12, radius = 5, thickness = 2, color = 0xff8888) {
        const gearGroup = new THREE.Group();
        
        // Create gear geometry
        const gearGeometry = createBevelGearGeometry(teeth, radius, thickness);
        const gearMaterial = new THREE.MeshPhongMaterial({ color, flatShading: true });
        const gearMesh = new THREE.Mesh(gearGeometry, gearMaterial);
        gearMesh.rotation.x = Math.PI / 2;
        gearMesh.castShadow = true;
        gearGroup.add(gearMesh);
        
        // Physics body (simplified as cylinder)
        const gearShape = new CANNON.Cylinder(
            radius * 0.8,
            radius * 0.8 * 0.7,
            thickness,
            16
        );
        
        const gearBody = new CANNON.Body({
            mass: 1,
            shape: gearShape,
            material: gearMaterial,
            position: new CANNON.Vec3(
                (Math.random() - 0.5) * 10,
                thickness / 2,
                (Math.random() - 0.5) * 10
            ),
            angularVelocity: new CANNON.Vec3(0, 0, 0),
            angularDamping: 0.5
        });
        
        // Add properties to the gear object
        gearGroup.userData = {
            type: 'bevel',
            teeth,
            radius,
            thickness,
            color,
            speed: 0.5,
            direction: 1,
            mesh: gearMesh,
            body: gearBody,
            connections: [],
            isDriver: false
        };
        
        world.addBody(gearBody);
        return gearGroup;
    }
    
    function createWormGear(length = 10, radius = 2, color = 0x88ff88) {
        const gearGroup = new THREE.Group();
        
        // Create worm gear geometry
        const gearGeometry = createWormGearGeometry(length, radius);
        const gearMaterial = new THREE.MeshPhongMaterial({ color, flatShading: true });
        const gearMesh = new THREE.Mesh(gearGeometry, gearMaterial);
        gearMesh.castShadow = true;
        gearGroup.add(gearMesh);
        
        // Physics body (simplified as cylinder)
        const gearShape = new CANNON.Cylinder(
            radius,
            radius,
            length,
            16
        );
        
        const gearBody = new CANNON.Body({
            mass: 1,
            shape: gearShape,
            material: gearMaterial,
            position: new CANNON.Vec3(
                (Math.random() - 0.5) * 10,
                radius,
                (Math.random() - 0.5) * 10
            ),
            angularVelocity: new CANNON.Vec3(0, 0, 0),
            angularDamping: 0.5
        });
        
        // Rotate physics body to match visual orientation
        gearBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        
        // Add properties to the gear object
        gearGroup.userData = {
            type: 'worm',
            length,
            radius,
            color,
            speed: 2,
            direction: 1,
            mesh: gearMesh,
            body: gearBody,
            connections: [],
            isDriver: false
        };
        
        world.addBody(gearBody);
        return gearGroup;
    }
    
    // Geometry creation helpers
    function createGearGeometry(teeth, radius, thickness) {
        const geometry = new THREE.CylinderGeometry(radius, radius, thickness, teeth * 2);
        
        // Modify vertices to create teeth
        const positionAttribute = geometry.getAttribute('position');
        for (let i = 0; i < positionAttribute.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positionAttribute, i);
            
            // Alternate between inner and outer radius for teeth
            if (i % 2 === 0) {
                const angle = Math.atan2(vertex.z, vertex.x);
                vertex.x = (radius * 0.9) * Math.cos(angle);
                vertex.z = (radius * 0.9) * Math.sin(angle);
            }
            
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        return geometry;
    }
    
    function createBevelGearGeometry(teeth, radius, thickness) {
        const geometry = new THREE.CylinderGeometry(radius, radius * 0.7, thickness, teeth * 2);
        
        // Modify vertices to create teeth
        const positionAttribute = geometry.getAttribute('position');
        for (let i = 0; i < positionAttribute.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positionAttribute, i);
            
            // Alternate between inner and outer radius for teeth
            if (i % 2 === 0) {
                const angle = Math.atan2(vertex.z, vertex.x);
                const yFactor = (vertex.y + thickness/2) / thickness;
                const toothRadius = radius * (0.9 - yFactor * 0.2);
                vertex.x = toothRadius * Math.cos(angle);
                vertex.z = toothRadius * Math.sin(angle);
            }
            
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        return geometry;
    }
    
    function createWormGearGeometry(length, radius) {
        const segments = 64;
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments * Math.PI * 8;
            const x = t * length / (Math.PI * 8) - length/2;
            const y = Math.sin(t * 2) * radius * 0.3;
            const z = Math.cos(t * 2) * radius * 0.3;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const path = new THREE.CatmullRomCurve3(points);
        return new THREE.TubeGeometry(path, segments, radius, 8, false);
    }
    
    // Add gear to scene
    function addGear(type) {
        let gear;
        
        switch(type) {
            case 'spur':
                gear = createSpurGear();
                break;
            case 'bevel':
                gear = createBevelGear();
                break;
            case 'worm':
                gear = createWormGear();
                break;
            default:
                gear = createSpurGear();
        }
        
        scene.add(gear);
        gears.push(gear);
        updateGearUI();
        updateConnectionUI();
    }
    
    // Create a connection between two gears
    function createGearConnection(gear1, gear2) {
        // Check if connection already exists
        const existingConnection = gear1.userData.connections.find(
            conn => conn.gear === gear2
        );
        
        if (existingConnection) {
            console.log("Connection already exists");
            return;
        }
        
        // Calculate the gear ratio based on teeth count
        let ratio = 1;
        if (gear1.userData.teeth && gear2.userData.teeth) {
            ratio = gear1.userData.teeth / gear2.userData.teeth;
        }
        
        // Create connection object
        const connection = {
            gear: gear2,
            ratio: ratio,
            constraint: null
        };
        
        // Add to both gears' connections (but only one will be active)
        gear1.userData.connections.push(connection);
        
        // Create a physics constraint to keep gears meshed
        if (gear1.userData.type === 'worm' || gear2.userData.type === 'worm') {
            // Worm gears need special constraints
            const wormGear = gear1.userData.type === 'worm' ? gear1 : gear2;
            const otherGear = gear1.userData.type === 'worm' ? gear2 : gear1;
            
            // Position constraint to keep worm gear engaged
            const constraint = new CANNON.PointToPointConstraint(
                wormGear.userData.body,
                new CANNON.Vec3(0, 0, 0),
                otherGear.userData.body,
                new CANNON.Vec3(0, 0, 0),
                0
            );
            world.addConstraint(constraint);
            connection.constraint = constraint;
        } else {
            // Regular gear connection
            const constraint = new CANNON.DistanceConstraint(
                gear1.userData.body,
                gear2.userData.body,
                gear1.userData.radius + gear2.userData.radius
            );
            world.addConstraint(constraint);
            connection.constraint = constraint;
        }
        
        updateConnectionUI();
    }
    
    // Update gear properties UI
    function updateGearUI() {
        const gearProperties = document.getElementById('gear-properties');
        const connectionControls = document.getElementById('connection-controls');
        gearProperties.innerHTML = '';
        
        if (!selectedGear) {
            gearProperties.innerHTML = '<p>No gear selected</p>';
            connectionControls.style.display = 'none';
            return;
        }
        
        connectionControls.style.display = 'block';
        const gear = selectedGear;
        const data = gear.userData;
        
        // Create property controls based on gear type
        function createPropertyRow(label, value, min, max, step, onChange) {
            const row = document.createElement('div');
            row.className = 'property-row';
            
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.value = value;
            input.min = min;
            input.max = max;
            input.step = step;
            input.addEventListener('input', () => {
                const numValue = parseFloat(input.value);
                onChange(numValue);
                updateGearVisual(gear);
            });
            
            row.appendChild(labelEl);
            row.appendChild(input);
            return row;
        }
        
        // Common properties
        gearProperties.appendChild(createPropertyRow(
            'Speed', data.speed, -5, 5, 0.1,
            value => { data.speed = value; }
        ));
        
        gearProperties.appendChild(createPropertyRow(
            'Direction', data.direction, -1, 1, 1,
            value => { data.direction = value; }
        ));
        
        // Driver toggle
        const driverRow = document.createElement('div');
        driverRow.className = 'property-row';
        
        const driverLabel = document.createElement('label');
        driverLabel.textContent = 'Is Driver';
        
        const driverCheck = document.createElement('input');
        driverCheck.type = 'checkbox';
        driverCheck.checked = data.isDriver;
        driverCheck.addEventListener('change', () => {
            data.isDriver = driverCheck.checked;
        });
        
        driverRow.appendChild(driverLabel);
        driverRow.appendChild(driverCheck);
        gearProperties.appendChild(driverRow);
        
        // Type-specific properties
        if (data.type === 'spur' || data.type === 'bevel') {
            gearProperties.appendChild(createPropertyRow(
                'Teeth', data.teeth, 6, 36, 1,
                value => { 
                    data.teeth = value; 
                    // Recreate gear mesh
                    gear.remove(data.mesh);
                    const newGear = data.type === 'spur' ? 
                        createSpurGear(value, data.radius, data.thickness, data.color) :
                        createBevelGear(value, data.radius, data.thickness, data.color);
                    data.mesh = newGear.children[0];
                    gear.add(data.mesh);
                    
                    // Update connection ratios
                    updateConnectionRatios(gear);
                }
            ));
            
            gearProperties.appendChild(createPropertyRow(
                'Radius', data.radius, 1, 10, 0.1,
                value => { 
                    data.radius = value; 
                    // Recreate gear mesh
                    gear.remove(data.mesh);
                    const newGear = data.type === 'spur' ? 
                        createSpurGear(data.teeth, value, data.thickness, data.color) :
                        createBevelGear(data.teeth, value, data.thickness, data.color);
                    data.mesh = newGear.children[0];
                    gear.add(data.mesh);
                    
                    // Update physics body
                    world.removeBody(data.body);
                    const newBody = data.type === 'spur' ? 
                        createSpurGear(data.teeth, value, data.thickness, data.color).userData.body :
                        createBevelGear(data.teeth, value, data.thickness, data.color).userData.body;
                    newBody.position.copy(data.body.position);
                    newBody.quaternion.copy(data.body.quaternion);
                    newBody.velocity.copy(data.body.velocity);
                    newBody.angularVelocity.copy(data.body.angularVelocity);
                    data.body = newBody;
                    world.addBody(data.body);
                    
                    // Update connection constraints
                    updateConnectionConstraints(gear);
                }
            ));
            
            gearProperties.appendChild(createPropertyRow(
                'Thickness', data.thickness, 0.5, 5, 0.1,
                value => { 
                    data.thickness = value; 
                    // Recreate gear mesh
                    gear.remove(data.mesh);
                    const newGear = data.type === 'spur' ? 
                        createSpurGear(data.teeth, data.radius, value, data.color) :
                        createBevelGear(data.teeth, data.radius, value, data.color);
                    data.mesh = newGear.children[0];
                    gear.add(data.mesh);
                    
                    // Update physics body
                    world.removeBody(data.body);
                    const newBody = data.type === 'spur' ? 
                        createSpurGear(data.teeth, data.radius, value, data.color).userData.body :
                        createBevelGear(data.teeth, data.radius, value, data.color).userData.body;
                    newBody.position.copy(data.body.position);
                    newBody.quaternion.copy(data.body.quaternion);
                    newBody.velocity.copy(data.body.velocity);
                    newBody.angularVelocity.copy(data.body.angularVelocity);
                    data.body = newBody;
                    world.addBody(data.body);
                }
            ));
        } else if (data.type === 'worm') {
            gearProperties.appendChild(createPropertyRow(
                'Length', data.length, 5, 20, 0.5,
                value => { 
                    data.length = value; 
                    // Recreate gear mesh
                    gear.remove(data.mesh);
                    const newGear = createWormGear(value, data.radius, data.color);
                    data.mesh = newGear.children[0];
                    gear.add(data.mesh);
                    
                    // Update physics body
                    world.removeBody(data.body);
                    const newBody = createWormGear(value, data.radius, data.color).userData.body;
                    newBody.position.copy(data.body.position);
                    newBody.quaternion.copy(data.body.quaternion);
                    newBody.velocity.copy(data.body.velocity);
                    newBody.angularVelocity.copy(data.body.angularVelocity);
                    data.body = newBody;
                    world.addBody(data.body);
                    
                    // Update connection constraints
                    updateConnectionConstraints(gear);
                }
            ));
            
            gearProperties.appendChild(createPropertyRow(
                'Radius', data.radius, 1, 5, 0.1,
                value => { 
                    data.radius = value; 
                    // Recreate gear mesh
                    gear.remove(data.mesh);
                    const newGear = createWormGear(data.length, value, data.color);
                    data.mesh = newGear.children[0];
                    gear.add(data.mesh);
                    
                    // Update physics body
                    world.removeBody(data.body);
                    const newBody = createWormGear(data.length, value, data.color).userData.body;
                    newBody.position.copy(data.body.position);
                    newBody.quaternion.copy(data.body.quaternion);
                    newBody.velocity.copy(data.body.velocity);
                    newBody.angularVelocity.copy(data.body.angularVelocity);
                    data.body = newBody;
                    world.addBody(data.body);
                    
                    // Update connection constraints
                    updateConnectionConstraints(gear);
                }
            ));
        }
        
        // Color picker
        const colorRow = document.createElement('div');
        colorRow.className = 'property-row';
        
        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Color';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = '#' + data.color.toString(16).padStart(6, '0');
        colorInput.addEventListener('input', () => {
            data.color = parseInt(colorInput.value.substring(1), 16);
            data.mesh.material.color.setHex(data.color);
        });
        
        colorRow.appendChild(colorLabel);
        colorRow.appendChild(colorInput);
        gearProperties.appendChild(colorRow);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete Gear';
        deleteBtn.addEventListener('click', () => {
            // Remove all connections first
            data.connections.forEach(conn => {
                if (conn.constraint) {
                    world.removeConstraint(conn.constraint);
                }
                
                // Remove the reverse connection
                const otherGear = conn.gear;
                const otherConnIndex = otherGear.userData.connections.findIndex(
                    c => c.gear === gear
                );
                if (otherConnIndex !== -1) {
                    if (otherGear.userData.connections[otherConnIndex].constraint) {
                        world.removeConstraint(otherGear.userData.connections[otherConnIndex].constraint);
                    }
                    otherGear.userData.connections.splice(otherConnIndex, 1);
                }
            });
            
            // Remove from physics world and scene
            world.removeBody(data.body);
            scene.remove(gear);
            gears = gears.filter(g => g !== gear);
            selectedGear = null;
            updateGearUI();
            updateConnectionUI();
        });
        gearProperties.appendChild(deleteBtn);
    }
    
    // Update connection UI
    function updateConnectionUI() {
        const connectToSelect = document.getElementById('connect-to');
        const connectionsList = document.getElementById('connections');
        
        connectToSelect.innerHTML = '';
        connectionsList.innerHTML = '';
        
        if (!selectedGear) return;
        
        // Populate connect-to dropdown with other gears
        gears.forEach((gear, index) => {
            if (gear !== selectedGear) {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `Gear ${index + 1} (${gear.userData.type})`;
                connectToSelect.appendChild(option);
            }
        });
        
        // Show current connections
        selectedGear.userData.connections.forEach((conn, index) => {
            const gearIndex = gears.indexOf(conn.gear);
            const item = document.createElement('div');
            item.className = 'connection-item';
            item.textContent = `Connected to Gear ${gearIndex + 1} (Ratio: ${conn.ratio.toFixed(2)})`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Remove';
            deleteBtn.style.width = 'auto';
            deleteBtn.style.margin = '2px 0';
            deleteBtn.addEventListener('click', () => {
                // Remove constraint
                if (conn.constraint) {
                    world.removeConstraint(conn.constraint);
                }
                
                // Remove from other gear's connections
                const otherGear = conn.gear;
                const otherConnIndex = otherGear.userData.connections.findIndex(
                    c => c.gear === selectedGear
                );
                if (otherConnIndex !== -1) {
                    if (otherGear.userData.connections[otherConnIndex].constraint) {
                        world.removeConstraint(otherGear.userData.connections[otherConnIndex].constraint);
                    }
                    otherGear.userData.connections.splice(otherConnIndex, 1);
                }
                
                // Remove from this gear's connections
                selectedGear.userData.connections.splice(index, 1);
                updateConnectionUI();
            });
            
            item.appendChild(deleteBtn);
            connectionsList.appendChild(item);
        });
    }
    
    // Update connection ratios when gear teeth change
    function updateConnectionRatios(gear) {
        gear.userData.connections.forEach(conn => {
            if (gear.userData.teeth && conn.gear.userData.teeth) {
                conn.ratio = gear.userData.teeth / conn.gear.userData.teeth;
            }
        });
        updateConnectionUI();
    }
    
    // Update connection constraints when gear sizes change
    function updateConnectionConstraints(gear) {
        gear.userData.connections.forEach(conn => {
            if (conn.constraint) {
                world.removeConstraint(conn.constraint);
            }
            
            if (gear.userData.type === 'worm' || conn.gear.userData.type === 'worm') {
                const wormGear = gear.userData.type === 'worm' ? gear : conn.gear;
                const otherGear = gear.userData.type === 'worm' ? conn.gear : gear;
                
                conn.constraint = new CANNON.PointToPointConstraint(
                    wormGear.userData.body,
                    new CANNON.Vec3(0, 0, 0),
                    otherGear.userData.body,
                    new CANNON.Vec3(0, 0, 0),
                    0
                );
            } else {
                conn.constraint = new CANNON.DistanceConstraint(
                    gear.userData.body,
                    conn.gear.userData.body,
                    gear.userData.radius + conn.gear.userData.radius
                );
            }
            
            world.addConstraint(conn.constraint);
        });
    }
    
    // Update gear visual based on properties
    function updateGearVisual(gear) {
        // For this example, we recreate the mesh when properties change
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Step the physics world
        world.step(1/60);
        
        // Update Three.js objects to match Cannon.js bodies
        gears.forEach(gear => {
            const data = gear.userData;
            
            // Sync position/rotation
            gear.position.copy(data.body.position);
            gear.quaternion.copy(data.body.quaternion);
            
            // Apply driver forces
            if (data.isDriver) {
                if (data.type === 'worm') {
                    // Worm gear rotates around its length (Y axis in Three.js)
                    data.body.angularVelocity.set(
                        0,
                        data.speed * data.direction * 2,
                        0
                    );
                } else {
                    // Other gears rotate around their axis (Z axis in Three.js)
                    data.body.angularVelocity.set(
                        0,
                        0,
                        data.speed * data.direction * 2
                    );
                }
            }
            
            // Apply gear connection effects
            data.connections.forEach(conn => {
                if (!data.isDriver && conn.gear.userData.isDriver) {
                    // This gear is driven by another gear
                    if (data.type === 'worm' || conn.gear.userData.type === 'worm') {
                        // Worm gear connection - different axis
                        if (data.type === 'worm') {
                            // Worm gear is being driven by another gear
                            data.body.angularVelocity.y = 
                                -conn.gear.userData.body.angularVelocity.z * conn.ratio;
                        } else {
                            // Regular gear is being driven by worm gear
                            data.body.angularVelocity.z = 
                                -conn.gear.userData.body.angularVelocity.y * conn.ratio;
                        }
                    } else {
                        // Regular gear connection
                        data.body.angularVelocity.z = 
                            -conn.gear.userData.body.angularVelocity.z * conn.ratio;
                    }
                }
            });
        });
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // Event listeners
    document.getElementById('add-gear').addEventListener('click', () => {
        const type = document.getElementById('gear-type').value;
        addGear(type);
    });
    
    document.getElementById('clear-all').addEventListener('click', () => {
        // Remove all constraints first
        gears.forEach(gear => {
            gear.userData.connections.forEach(conn => {
                if (conn.constraint) {
                    world.removeConstraint(conn.constraint);
                }
            });
            world.removeBody(gear.userData.body);
            scene.remove(gear);
        });
        
        gears = [];
        selectedGear = null;
        updateGearUI();
        updateConnectionUI();
    });
    
    document.getElementById('create-connection').addEventListener('click', () => {
        if (!selectedGear) return;
        
        const connectToIndex = parseInt(document.getElementById('connect-to').value);
        if (isNaN(connectToIndex) return;
        
        const otherGear = gears[connectToIndex];
        createGearConnection(selectedGear, otherGear);
        createGearConnection(otherGear, selectedGear); // Create reciprocal connection
    });
    
    // Gear selection
    window.addEventListener('click', (event) => {
        // Ignore clicks on UI elements
        if (event.target.closest('#ui')) return;
        
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the raycaster
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(gears);
        
        if (intersects.length > 0) {
            selectedGear = intersects[0].object.parent; // The gear is the parent of the mesh
            updateGearUI();
            updateConnectionUI();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
