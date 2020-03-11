import './index.sass';
var $ = require('jquery');
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

var scene, camera, renderer;
var raycaster, mouse;

var orbit;
var transform, transforms;


var meshes = [];
var selectedMeshes = []

const DEFAULT_SIZE = 100;
const GRID_CELLS = 1000;
const GRID_ROWS = 10;
const MAX_HISTORY = 10;


init();
animate();

function init() {
    set_scene();
    set_camera();
    set_renderer();
    set_light();
    set_mouse();
    set_raycaster();
    set_gui();
    set_window();
    set_orbit();
    set_transform();
    set_logs();
    default_mesh("b");
    set_clicks();
    set_keys();
}

function default_material() {
    return new THREE.MeshLambertMaterial({color: 0x606060, emissive: 0xffffff, 
        emissiveIntensity: 0});
}

function default_mesh(shape) {
    var geometry;
    switch (shape) {
        case "b": // Box
            geometry = new THREE.BoxBufferGeometry(DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE);
            break;
        case "s": // Sphere
            geometry = new THREE.SphereBufferGeometry(DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE);
            break;
    }
    var mesh = set_mesh(geometry, default_material());
    scene.add(mesh);
}

function log_transform(mesh) {
    var log = {};
    log["position"] = mesh.position.clone();
    log["rotation"] = mesh.rotation.clone();
    log["scale"] = mesh.scale.clone();
    var target = transforms[mesh.uuid];
    if (target.length > 0) {
        var last_transform = target[target.length - 1];
        if (!((last_transform.position.equals(log.position)) &&
            (last_transform.rotation.equals(log.rotation)) &&
            (last_transform.scale.equals(log.scale)))) {
                if (target.length >= MAX_HISTORY) {
                    target.shift();
                }
                target.push(log);
        }
    } else {
        target.push(log);
    }
}

function log_transforms() {
    selectedMeshes.forEach(element => {
        log_transform(element);
    })
}

function reset_controls() {
    transform.visible = false;
}

function remove_mesh(mesh) {
    scene.remove(mesh);
    deselect(mesh);
    mesh.uuid in transforms && remove_transforms(mesh);
    meshes.includes(mesh) && meshes.splice(meshes.indexOf(mesh), 1);
    mesh.traverse(element => {
        if (element instanceof THREE.Mesh) {
            element.geometry && element.geometry.dispose();
            if (element.material) {
                if (Array.isArray(element.material)) {
                    element.material.forEach(function (mtl, idx) {
                        mtl.dispose();
                    });
                } else {
                    element.material.dispose();
                }
            }
        }
    });
}

function remove_transforms(mesh) {
    transforms[mesh.uuid].forEach(element => {
        delete element.position;
        delete element.rotation;
        delete element.scale;
    });
    delete transforms[mesh.uuid];
}

function set_camera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight,
        0.1, 3000);
    camera.position.set(DEFAULT_SIZE * 2, DEFAULT_SIZE * 2, DEFAULT_SIZE * 2);
}

function set_default_materials() {
    var materials = [];
    materials.push(new THREE.MeshBasicMaterial({color: 0xff0000}));
    materials.push(new THREE.MeshBasicMaterial({color: 0xffff00}));
    materials.push(new THREE.MeshBasicMaterial({color: 0xff00ff}));
    materials.push(new THREE.MeshBasicMaterial({color: 0x00ff00}));
    materials.push(new THREE.MeshBasicMaterial({color: 0x0000ff}));
    materials.push(new THREE.MeshBasicMaterial({color: 0x00ffff}));
    return materials;
}

function set_edges(mesh) {
    var geometry = new THREE.EdgesGeometry(mesh.geometry);
    var material = new THREE.LineBasicMaterial({color: 0xffffff});
    var edges = new THREE.LineSegments(geometry, material);
    mesh.add(edges);
}

function set_gui() {
    var div = $('<div id="mode"></div>');
    div.text("View Mode");
    $('body').append(div);
}

function set_clicks() {
    window.addEventListener('mousedown', function(e) {
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(meshes);
        if (e.button == 0) {
            set_selection(intersects, select);
        } else if (e.button == 2) {
            set_selection(intersects, deselect);
        }
    });
}

function set_keys() {
    window.addEventListener('keydown', function(e) {
        switch(e.keyCode) {
            case 46: // Delete
                selectedMeshes.forEach(element => {
                    remove_mesh(element);
                });
                break;
            case 49: // 1
                selectedMeshes.forEach(element => {
                    deselect(element);
                })
                break;
            case 50: // 2
                break;
            case 82: // R
                transform.visible && transform.setMode("rotate");
                break;
            case 83: // S
                transform.visible && transform.setMode("scale");
                break;
            case 84: // T
                transform.visible && transform.setMode("translate");
                break;
            case 85: // U
                transform.visible && undo_transform();
                break;
            case 87: // W
                // Object.entries(meshes).forEach(([key, val]) => {
                //     // val.material.wireframe = !val.material.wireframe;
                //     val.material.forEach(element => {
                //         element.wireframe = !element.wireframe;
                //     })
                // });
                break;
        }
    });
}

function set_light() {
    var light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    
}

function set_logs() {
    transforms = {};
}

function set_mesh(geometry, material) {
    var mesh = new THREE.Mesh(geometry, material);
    set_edges(mesh);
    meshes.push(mesh);
    transforms[mesh.uuid] = [];
    return mesh;
}

function set_mouse() {
    mouse = new THREE.Vector2();
}

function set_orbit() {
    orbit = new OrbitControls(camera, renderer.domElement);
}

function set_raycaster() {
    raycaster = new THREE.Raycaster();
}

function set_renderer() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function set_scene() {
    scene = new THREE.Scene();
    scene.add(new THREE.GridHelper(GRID_CELLS, GRID_ROWS));

}

function deselect(mesh) {
    if (selectedMeshes.includes(mesh)) {
        mesh.material.emissiveIntensity = 0;
        transform.detach();
        selectedMeshes.splice(selectedMeshes.indexOf(mesh), 1);
        $('#mode').text('View Mode');
    }
}

function select(mesh) {
    if (!selectedMeshes.includes(mesh)) {
        mesh.material.emissiveIntensity = 0.25;
        transform.detach();
        transform.attach(mesh);
        selectedMeshes.push(mesh);
        log_transforms();
        $('#mode').text('Transform Mode');
    }
}

function set_selection(intersects, selector) {
    if (!((mouse.x == 0) && (mouse.y == 0))) {
        if (intersects.length > 0) {
            for (var i = 0; i < intersects.length; i++) {
                var target = intersects[i].object;
                selector(target)
                break;
            }
        }
    }
}

function set_transform() {
    transform = new TransformControls(camera, renderer.domElement);
    transform.addEventListener('change', function(e) {
        render();
    });
    transform.addEventListener('dragging-changed', function(e) {
        orbit.enabled = !e.value;
    });
    transform.domElement.addEventListener('mouseup', function(e) {
        if (transform.dragging) {
            log_transforms();
        }
    });
    scene.add(transform);
}

function set_window() {
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);

}

function undo_transform() {
    selectedMeshes.forEach(element => {
        var target = transforms[element.uuid];
        if (target.length > 1) {
            var next_transform = target[target.length - 2];
            element.position.copy(next_transform.position);
            element.rotation.copy(next_transform.rotation);
            element.scale.copy(next_transform.scale);
            target.pop();
            render();
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(meshes);
    if (!((mouse.x == 0) && (mouse.y == 0))) {
        if (intersects.length > 0) {
            $('body').css('cursor', 'pointer');
        } else {
            $('body').css('cursor', 'default');
        }
        // for (var i = 0; i < intersects.length; i++) {
        //     console.log("Here");
        //     break;
        //     // intersects[i].object.material[0].color.set(0xffffff);
        // }
    }
    renderer.render(scene, camera);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    render();

}