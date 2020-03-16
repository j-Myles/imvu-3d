import './index.sass';
var $ = require('jquery');
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { PlaneBufferGeometry } from 'three';

var scene, camera, renderer;
var raycaster, plane, mouse;

var orbit;
var transform, transforms;

var mode
var coords;

var primitive;
var meshes = [];
var selected;

const DEFAULT_SIZE = 100;
const GRID_CELLS = 1000;
const GRID_ROWS = 10;
const MAX_HISTORY = 10;
const COORD_DIGITS = 6;

init();
animate();

function init() {
    set_scene();
    set_plane();
    set_camera();
    set_renderer();
    set_light();
    // set_axes();
    set_mouse();
    set_raycaster();
    set_orbit();
    set_selected();
    set_transform();
    set_gui();
    set_coords();
    set_logs();
    default_mesh("box");
    set_clicks();
    set_keys();
    set_window();
}

function apply_selected(func) {
    var twins = selected.children.slice(0);
    twins.forEach(mesh => {
        func(mesh);
    });
}

function apply_transform(mesh) {
    mesh.applyMatrix4(selected.matrix);
}

function assign_primitive(event, prim1, prim2) {
    if (mode == 'Create') {
        if (event.shiftKey) {
            set_primitive(prim1);
        } else {
            set_primitive(prim2);
        }
    }
}

function create_mesh() {
    switch (primitive) {
        case 'Cube':
            default_mesh('box');
            break;
        case 'Square':
            default_mesh('plane');
            break;
        case 'Sphere':
            default_mesh('sphere');
            break;
        case 'Circle':
            default_mesh('circle');
            break;
        default:
            break;
    }
}

function default_material() {
    return new THREE.MeshLambertMaterial({color: 0x606060, emissive: 0xffffff, 
        emissiveIntensity: 0});
}

function default_mesh(shape) {
    var geometry;
    switch (shape) {
        case "box":
            geometry = new THREE.BoxBufferGeometry(DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE);
            break;
        case "circle":
            geometry = new THREE.CircleBufferGeometry(DEFAULT_SIZE, DEFAULT_SIZE);
            break;
        case "cylinder":
            geometry = new THREE.CylinderBufferGeometry(DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE);
            break;
        case "plane":
            geometry = new THREE.PlaneBufferGeometry(DEFAULT_SIZE, DEFAULT_SIZE);
            break;
        case "ring":
            geometry = new THREE.RingBufferGeometry(DEFAULT_SIZE / 2, DEFAULT_SIZE);
            break;
        case "sphere":
            geometry = new THREE.SphereBufferGeometry(DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE);
            break;
    }
    var mesh = set_mesh(geometry, default_material());
    mesh.position.set(coords.x, 0, coords.z);
    scene.add(mesh);
}

function log_transforms() {
    var log = {};
    log.position = selected.position.clone();
    log.rotation = selected.rotation.clone();
    log.scale = selected.scale.clone();
    if (transforms.length > 0) {
        var last_transform = transforms[transforms.length - 1];
        if (!((last_transform.position.equals(log.position)) &&
            (last_transform.rotation.equals(log.rotation)) &&
            (last_transform.scale.equals(log.scale)))) {
                if (transforms.length >= MAX_HISTORY) {
                    transforms.shift();
                }
                transforms.push(log);
            }
    } else {
        transforms.push(log);
    }
}

function remove_mesh(mesh) {
    deselect(mesh);
    scene.remove(mesh);
    // mesh.uuid in transforms && remove_transforms(mesh);
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

function set_coords() {
    coords = {};
    coords.x = 0;
    coords.y = 0;
    coords.z = 0;
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
    set_gui_coords();
    set_gui_mode();
    set_gui_primitive();
}

function set_gui_coords() {
    var container = $('<div id="coords"></coords>');
    container.append('<div id="x">0.00000</div>');
    // container.append('<div id="y">0.00000</div>');
    container.append('<div id="z">0.00000</div>');
    $('body').append(container);
}

function set_gui_mode() {
    var container = $('<div id="mode"></div>');
    $('body').append(container);
    set_mode("View");
}

function set_gui_primitive() {
    var container = $('<div id="primitive"></div>');
    $('body').append(container);
    $('#primitive').css('visibility', 'hidden');
    set_primitive("Cube");
}

function set_clicks() {
    window.addEventListener('mousedown', function(event) {
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(meshes);
        switch (mode) {
            case 'Create':
                if (event.button == THREE.MOUSE.LEFT) {
                    create_mesh();
                } else if (event.button == THREE.MOUSE.RIGHT) {
                    set_mode('View');
                }
                break;
            case 'Select':
                if (event.button == THREE.MOUSE.LEFT) {
                    set_selection(intersects, select);
                } else if (event.button == THREE.MOUSE.RIGHT) {
                    if (selected.children.length == 0) {
                        set_mode('View');
                    } else {
                        set_selection(intersects, deselect);
                    }
                }
                break;
            case 'Transform':
                (event.button == THREE.MOUSE.RIGHT) && set_mode('Select');
                break;
            default:
                break;
        }
    });
    window.addEventListener('dblclick', function(event) {
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(meshes);
        switch (mode) {
            case 'View':
                set_mode('Select');
                set_selection(intersects, select);
                break;
            default:
                break;
        }
    });
}

function set_keys() {
    window.addEventListener('keydown', function(event) {
        switch(event.keyCode) {
            case 46: // Delete
                apply_selected(remove_mesh);
                break;
            case 49: // 1
                set_mode("View");
                break;
            case 50: // 2
                set_mode("Create");
                break;
            case 51: // 3
                set_mode("Select");
                break;
            case 52: // 4
                set_mode("Transform");
                break;
            case 65: // A
                (mode == 'Transform') && transform.setMode("translate");
                break;
            case 68: // D
                (mode == 'Transform') && transform.setMode("rotate");
                break;
            case 69: // E
                break;
            case 81: // Q
                assign_primitive(event, 'Square', 'Cube');
                break;
            case 83: // S
                (mode == 'Transform') && transform.setMode("scale");
                break;
            case 85: // U
                (mode == 'Transform') && undo_transform();
                break;
            case 87: // W
                assign_primitive(event, 'Circle', 'Sphere');
                break;
            case 90: // Z
                (event.shiftKey) && undo();
            default:
                break;
        }
    });
}

function set_light() {
    var light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    
}

function set_logs() {
    transforms = [];
}

function set_mesh(geometry, material) {
    var mesh = new THREE.Mesh(geometry, material);
    set_edges(mesh);
    meshes.push(mesh);
    transforms[mesh.uuid] = [];
    return mesh;
}

function set_mode(name) {
    set_mode_create(name);
    set_mode_transform(name);
    set_mode_select(name);
    mode = name;
    $('#mode').text(name + ' Mode');
}

function set_mode_select(name) {
    if (name == 'Select') {
        
    } else {
        if (mode == 'Select') {
            if (name != 'Transform') {
                apply_selected(deselect);
            }
        }
    }
}

function set_mode_create(name) {
    if (name == 'Create') {
        $('#primitive').css('visibility', 'visible');
    } else {
        ($('#primitive').css('visibility') == 'visible') &&
        $('#primitive').css('visibility', 'hidden');
    }
}

function set_mode_transform(name) {
    if (name == 'Transform') {
        if (mode != 'Transform') {
            if (selected.children.length > 0) {
                var target = selected.children[0];
                transform.position.copy(target.position);
                transform.attach(selected);
                transform.visible = true;
            }
        }
    } else {
        if (mode == 'Transform') {
            apply_selected(apply_transform)
            apply_selected(deselect);
            selected.position.set(0, 0, 0);
            selected.rotation.set(0, 0, 0);
            selected.scale.set(1, 1, 1);
            transform.detach(selected);
            transform.visible = false;
        }
    }
}

function set_mouse() {
    mouse = new THREE.Vector2();
}

function set_primitive(prim) {
    primitive = prim;
    $('#primitive').text(primitive);
}

function set_orbit() {
    orbit = new OrbitControls(camera, renderer.domElement);
}

function set_plane() {
    var geometry = new THREE.BoxBufferGeometry(GRID_CELLS, 0, GRID_CELLS);
    var material = new THREE.LineBasicMaterial();
    plane = new THREE.Mesh(geometry, material);
    plane.visible = false;
    scene.add(plane);

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
    if (selected.children.includes(mesh)) {
        mesh.material.emissiveIntensity = 0;
        selected.remove(mesh);
        scene.add(mesh);
        // mesh.applyMatrix4(selected.matrix);
        // if (selected.children.length == 0) {
        //     selected.position.set(0, 0, 0);
        //     selected.rotation.set(0, 0, 0);
        //     selected.scale.set(1, 1, 1);
        //     set_mode('View');
        // } else {
            
        // }
    }
}

function select(mesh) {
    if (!selected.children.includes(mesh)) {
        mesh.material.emissiveIntensity = 0.25;
        if (selected.children.length == 0) {
            // transform.detach();
            // transform.position.copy(mesh.position);
            // transform.rotation.copy(mesh.rotation);
            // transform.scale.copy(mesh.scale);
            // transform.attach(selected);
        }
        selected.add(mesh);
        // log_transforms();
        // if (mode != 'Transform') {
        //     set_mode('Transform');
        // }
    } else {
        set_mode('Transform');
    }
}

function set_selection(intersects, selector) {
    if (!((mouse.x == 0) && (mouse.y == 0))) {
        if (intersects.length > 0) {
            var target = intersects[0].object;
            selector(target)
            // for (var i = 0; i < intersects.length; i++) {
            //     var target = intersects[i].object;
            //     selector(target)
            //     break;
            // }
        }
    }
}

function set_selected() {
    selected = new THREE.Group();
    scene.add(selected);
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
            console.log(selected.position);
            // log_transforms();
        }
    });
    transform.visible = false;
    scene.add(transform);
}

function set_window() {
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
}

function undo_transform() {
    if (transforms.length > 1) {
        var next_transform = transforms[transforms.length - 2];
        selected.position.copy(next_transform.position);
        selected.rotation.copy(next_transform.rotation);
        selected.scale.copy(next_transform.scale);
        transforms.pop();
        render();
    }
}

function undo() {

}

function animate() {
    requestAnimationFrame(animate);
    rays();
    render();
}

function rays() {
    raycaster.setFromCamera(mouse, camera);
    var intersects;
    intersects = raycaster.intersectObjects(meshes);
    if (!((mouse.x == 0) && (mouse.y == 0))) {
        if (intersects.length > 0) {
            $('body').css('cursor', 'pointer');
        } else {
            $('body').css('cursor', 'default');
        }
    }
}

function render() {
    renderer.render(scene, camera);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObject(plane);
    if (intersects.length > 0) {
        var point = intersects[0].point;
        coords.x = point.x;
        coords.z = point.z;
    }
    // vect.set(mouse.x, mouse.y, 0.5);
    // vect.unproject(camera);
    // var dir = vect.sub(camera.position).normalize();
    // var dist = - camera.position.z / dir.z;
    // var point = camera.position.clone().add(dir.multiplyScalar(dist));
    // coords.x = point.x;
    // coords.y = point.y;
    $('#coords #x').text(coords.x.toPrecision(COORD_DIGITS));
    // $('#coords #y').text(coords.y.toPrecision(COORD_DIGITS));  
    $('#coords #z').text(coords.z.toPrecision(COORD_DIGITS));
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    render();

}