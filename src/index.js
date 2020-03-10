import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';


var scene, camera, renderer;
var orbit, transform;

var meshes = {};

const DEFAULT_SIZE = 100;
const GRID_CELLS = 1000;
const GRID_ROWS = 10;


init();
animate();

function init() {
    set_scene();
    set_camera();
    set_renderer();
    set_window();
    set_orbit();
    set_transform();
    var geometry = set_default_geometry();
    var material = set_default_material();
    var mesh = set_mesh(geometry, material);
    meshes["default"] = mesh;
    scene.add(mesh);
    transform.attach(mesh);
    scene.add(transform);
    set_keys();

}

function set_camera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight,
        0.1, 1000);
    camera.position.set(DEFAULT_SIZE * 2, DEFAULT_SIZE * 2, DEFAULT_SIZE * 2);

}

function set_default_geometry() {
    return new THREE.BoxBufferGeometry(DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE);
}

function set_default_material() {
    return new THREE.MeshNormalMaterial({});
}

function set_keys() {
    window.addEventListener('keydown', function(e) {
        switch(e.keyCode) {
            case 87: // W
                Object.entries(meshes).forEach(([key, val]) => {
                    val.material.wireframe = !val.material.wireframe;
                });

        }
    })
}

function set_mesh(geometry, material) {
    return new THREE.Mesh(geometry, material);
}

function set_orbit() {
    orbit = new OrbitControls(camera, renderer.domElement);
}

function set_scene() {
    scene = new THREE.Scene();
    scene.add(new THREE.GridHelper(GRID_CELLS, GRID_ROWS));

}

function set_transform() {
    transform = new TransformControls(camera, renderer.domElement);
    transform.addEventListener('change', render);
    transform.addEventListener('dragging-changed', function(e) {
        orbit.enabled = !e.value;
    });

}

function set_window() {
    window.addEventListener('resize', onWindowResize, false);
}

function set_renderer() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    render();

}