import { Scene } from 'three';

var scene, camera, renderer;

function init() {

}

function set_camera() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth, window.innerHeight,
        0.1, 1000);
}

function set_scene() {
    scene = new Scene();
}