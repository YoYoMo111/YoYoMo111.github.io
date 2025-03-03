/**
 * Notes:
 * - Coordinates are specified as (X, Y, Z) where X and Z are horizontal and Y
 *   is vertical
 */

var map = [ // 1  2  3  4  5  6  7  8  9
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 0
           [1, 1, 0, 0, 0, 0, 0, 1, 1, 1,], // 1
           [1, 1, 0, 0, 2, 0, 0, 0, 0, 1,], // 2
           [1, 0, 0, 0, 0, 2, 2, 0, 0, 1,], // 3
           [1, 0, 0, 2, 0, 0, 0, 0, 0, 1,], // 4
           [1, 0, 0, 0, 2, 0, 0, 0, 1, 1,], // 5
           [1, 1, 1, 0, 0, 0, 0, 1, 1, 1,], // 6
           [1, 1, 1, 0, 0, 1, 0, 0, 1, 1,], // 7
           [1, 1, 1, 1, 1, 1, 0, 0, 1, 1,], // 8
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 9
           ], mapW = map.length, mapH = map[0].length;

var map2 = [ // 1  2  3  4  5  6  7  8  9
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 0
           [1, 1, 0, 0, 0, 0, 0, 1, 1, 1,], // 1
           [1, 1, 0, 0, 2, 0, 0, 0, 0, 1,], // 2
           [1, 0, 0, 0, 0, 0, 0, 0, 0, 1,], // 3
           [1, 0, 0, 2, 0, 0, 0, 0, 0, 1,], // 4    this only used for create walls
           [1, 0, 0, 0, 2, 0, 0, 0, 1, 1,], // 5
           [1, 1, 1, 0, 0, 0, 0, 1, 1, 1,], // 6
           [1, 1, 1, 0, 0, 1, 0, 0, 1, 1,], // 7
           [1, 1, 1, 1, 1, 1, 0, 0, 1, 1,], // 8
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 9
           ];

// Semi-constants
var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	ASPECT = WIDTH / HEIGHT,
	UNITSIZE = 250,
	WALLHEIGHT = UNITSIZE / 3,
	MOVESPEED = 100,
	LOOKSPEED = 0.075,
	BULLETMOVESPEED = MOVESPEED * 5,
	NUMAI = 5,
	PROJECTILEDAMAGE = 20;
// Global vars
var t = THREE, scene, cam, renderer, controls, clock, projector, model, skin;
var runAnim = true, mouse = { x: 0, y: 0 }, kills = 0, health = 100;
var healthCube, lastHealthPickup = 0, pickuphealthPlay = 1;
var bgmusic, winsound, losesound, blast, scream, rainsound, windsound, pickhealth, hurtwarn;//audio varibles
var wingame, losegame;
var jsonLoader, gun, rock1, rock2, rock3, house, tree,tree2,tree3,tree4;
var mouse3D;
//var bgmusic = new THREE.AudioObject('audio/background.wav', 0, 1, false);//volume,playback rate,looping
/*
var finder = new PF.AStarFinder({ // Defaults to Manhattan heuristic
	allowDiagonal: true,
}), grid = new PF.Grid(mapW, mapH, map);
*/

// Initialize and run on document ready
$(document).ready(function() {
	$('body').append('<div id="intro"><div id = "intro-content">Kill 4 enemies, Click here to start</div></div>');
	$('#intro').css({width: WIDTH, height: HEIGHT});
	$('#intro-content').one('click', function(e) {
		e.preventDefault();
		//$(this).fadeOut();
		//$('#intro').fadeOut();
		init();
		setInterval(drawRadar, 1000);
		animate();
	});
	/*
	new t.ColladaLoader().load('models/Yoshi/Yoshi.dae', function(collada) {
		model = collada.scene;
		skin = collada.skins[0];
		model.scale.set(0.2, 0.2, 0.2);
		model.position.set(0, 5, 0);
		scene.add(model);
	});
	*/
});

// Setup
var fogEffect=-1;
var rainEffect=-1;
var snowEffect=-1;
var duskEffect=-1;
var sky;
//----------------particle varibles----------------------------------
	// create the particle variables
	var particleCount = 7000,
		particles = new THREE.Geometry(),
		pMap /*= THREE.ImageUtils.loadTexture(
			  "images/raindrop.png"
			)*/,
		pMaterial = new THREE.ParticleBasicMaterial({
		    color: 0xFFFFFF,
			size: 5,
			map: pMap,
			blending: THREE.AdditiveBlending,
			transparent: true
		});
	// create the particle system
	var particleSystem = new THREE.ParticleSystem(
				particles,
				pMaterial);

	// now create the individual particles
		for (var p = 0; p < particleCount; p++) {

		  // create a particle with random
		  // position values, -250 -> 250
		  var pX = Math.random() * 2200 - 1100,
		      pY = Math.random() * 2200 - 1100,
		      pZ = Math.random() * 2200 - 1100,
		      particle = new THREE.Vector3(pX, pY, pZ);//function name changed!!!

		      // create a velocity vector
				particle.velocity = new THREE.Vector3(
				  0,              // x
				  -Math.random(), // y: random vel
				  0);             // z

		  // add it to the geometry
		  particles.vertices.push(particle);
		  //particles.rotateZ( 90*Math.PI / 180);
		}
//---------------particle varibles end------------------------------------				

function init() {
	clock = new t.Clock(); // Used in render() for controls.update()
	projector = new t.Projector(); // Used in bullet projection
	scene = new t.Scene(); // Holds all objects in the canvas
	wingame = false;
	losegame = false;
	//set up audio--------------------------------------------
	bgmusic =  document.getElementById ('bgmusic');
	winsound =  document.getElementById ('winsound');
	losesound =  document.getElementById ('losesound');
	blast =  document.getElementById ('blast');
	scream =  document.getElementById ('scream');
	rainsound =  document.getElementById ('rainsound');
	windsound =  document.getElementById ('windsound');
	pickhealth =  document.getElementById ('pickhealth');
	hurtwarn = document.getElementById ('hurtwarn');
	bgmusic.volume = 0.5;
	bgmusic.play();
	//scene.add(bgmusic);
	//THREE.AudioObject.call(bgmusic, 'background.wav', 1, 1, true);

	//set up axes
	var axes = new THREE.AxisHelper(100);
	//scene.add(axes);

	//set up particle (actually have done it before init())------------------------------
	

		// also update the particle system to
		// sort the particles which enables
		// the behaviour we want
		particleSystem.sortParticles = true;

		//particleSystem.rotation.x = 1;

		// add it to the scene
		//scene.add(particleSystem);
		

	//------------------------------------------------------------------

	// Set up camera
	cam = new t.PerspectiveCamera(60, ASPECT, 1, 10000); // FOV, aspect, near, far
	cam.position.y = UNITSIZE * .2;
	scene.add(cam);
	
	// Camera moves with mouse, flies around with WASD/arrow keys
	controls = new t.FirstPersonControls(cam);
	controls.movementSpeed = MOVESPEED;
	controls.lookSpeed = LOOKSPEED;

	$(document).click(function(e) {
		e.preventDefault;
		if (e.which === 3) { // right click only
			controls.lookVertical = true;
		}
		else{controls.lookVertical = false;}
	});

	//controls.lookVertical = true; // Temporary solution; play on flat surfaces only
	controls.noFly = true;


   /////////Set Up ColladaLoader//////////////////--------------------------------------------------
	
	//jsonLoader = new THREE.JSONLoader();
	gun = new THREE.Mesh();
	/*jsonLoader.load("models/misc_chair01.js", function( geometry , mat ) {
		gun = new THREE.Mesh( geometry, mat[0]);
		gun.scale.set( 1000, 1000, 1000);
		scene.add( gun );
		console.log("load gun");
	}, "models");*/
   /*
	jsonLoader.load("models/Handgun.json", function( geometry ) {
		var gunMaterial = new THREE.MeshLambertMaterial({
    				map: THREE.ImageUtils.loadTexture('models/handgun_C.jpg')});
		gun = new THREE.Mesh( geometry, gunMaterial);
		gun.scale.set( 30, 30, 30);
		scene.add( gun );
	});*/

	var loader = new THREE.ColladaLoader();

	loader.load(
		// resource URL
		'models/Handgun.dae',
		// Function when resource is loaded
		function ( geometry ) {
			/*var rotMat = new THREE.Matrix4().makeRotationZ(Math.PI/2);
			collada.applyMatrix4( rotMat );*/
			//geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,10,20));
			gun = geometry.scene;

			gun.children[0].material.map = THREE.ImageUtils.loadTexture('models/handgun_C.jpg');
			//gun.children[0].material = new THREE.MeshBasicMaterial();
			/*gun.children[0].material = new THREE.MeshBasicMaterial({
    				map: THREE.ImageUtils.loadTexture('models/handgun_C.jpg')}
    				);*/
			gun.rotation.set(-Math.PI/2+Math.PI/6,0, Math.PI/2);
			gun.scale.set( 7, 10, 7);
			gun.position.set(0,-10,-20);
			//gun.rotation.z = Math.PI/3;
			//cam.add( gun );
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		}
	);
	//mouseMove event
		/*mouse3D = new THREE.Vector3(
		 ( event.clientX / window.innerWidth ) * 2 - 1,
		 - ( event.clientY / window.innerHeight ) * 2 + 1,
		 0.5 );*/


	rock1 = new THREE.Mesh();
	var loader2 = new THREE.ColladaLoader();

	loader2.load(
		// resource URL
		'models/Rock1.dae',
		// Function when resource is loaded
		function ( geometry ) {
			rock1 = geometry.scene;

			//rock1.children[0].material.map = THREE.ImageUtils.loadTexture('models/house_wall.jpg');
			rock1.children[0].material = new THREE.MeshBasicMaterial();
			rock1.children[0].material = new THREE.MeshBasicMaterial({
    				map: THREE.ImageUtils.loadTexture('models/Rock1.jpg')}
    				);
			rock1.rotation.set(-Math.PI/2,0, Math.PI/2);
			rock1.scale.set( 25, 25, 25);
			rock1.position.set(-570,0,-95);
			rock1.children[0].receiveShadow = true;//shadow
			rock1.children[0].castShadow = true;

			scene.add( rock1 );
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		}
	);

	rock2 = new THREE.Mesh();
	var loader3 = new THREE.ColladaLoader();

	loader3.load(
		// resource URL
		'models/Rock2.dae',
		// Function when resource is loaded
		function ( geometry ) {
			rock2 = geometry.scene;

			//rock1.children[0].material.map = THREE.ImageUtils.loadTexture('models/house_wall.jpg');
			rock2.children[0].material = new THREE.MeshBasicMaterial();
			rock2.children[0].material = new THREE.MeshBasicMaterial({
    				map: THREE.ImageUtils.loadTexture('models/Rock2.jpg')}
    				);
			rock2.rotation.set(-Math.PI/2,0, Math.PI/2);
			rock2.scale.set( 40, 40, 40);
			rock2.position.set(-570,0,-70);
			rock2.children[0].receiveShadow = true;//shadow
			rock2.children[0].castShadow = true;


			//scene.add( rock2 );
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		}
	);

	rock3 = new THREE.Mesh();
	var loader4 = new THREE.ColladaLoader();

	loader4.load(
		// resource URL
		'models/Rock3.dae',
		// Function when resource is loaded
		function ( geometry ) {
			rock3 = geometry.scene;

			//rock1.children[0].material.map = THREE.ImageUtils.loadTexture('models/house_wall.jpg');
			rock3.children[0].material = new THREE.MeshBasicMaterial();
			rock3.children[0].material = new THREE.MeshBasicMaterial({
    				map: THREE.ImageUtils.loadTexture('models/Rock3.jpg')}
    				);
			rock3.rotation.set(-Math.PI/2,0, Math.PI/2);
			rock3.scale.set( 100, 100, 100);
			rock3.position.set(0,-10,-20);

			//scene.add( rock3 );
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		}
	);


	house = new THREE.Mesh();
	var loader5 = new THREE.ColladaLoader();

	loader5.load(
		// resource URL
		'models/house2.dae',
		// Function when resource is loaded
		function ( geometry ) {
			house = geometry.scene;

			//rock1.children[0].material.map = THREE.ImageUtils.loadTexture('models/house_wall.jpg');
			house.children[0].material = new THREE.MeshBasicMaterial();
			house.children[0].material = new THREE.MeshBasicMaterial({
    				map: THREE.ImageUtils.loadTexture('models/house_wall.jpg')}
    				);
			house.children[1].material = new THREE.MeshBasicMaterial();
			house.children[1].material = new THREE.MeshBasicMaterial({
    				map: THREE.ImageUtils.loadTexture('models/house_wood.jpg')}
    				);
			house.rotation.set(-Math.PI/2,0, Math.PI/2);
			house.scale.set( 75, 75, 75);
			house.position.set(-510,-4,80);
			house.children[0].receiveShadow = true;//shadow
			house.children[0].castShadow = true;
			house.children[1].receiveShadow = true;//shadow
			house.children[1].castShadow = true;

			scene.add( house );
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		}
	);


	tree = new THREE.Mesh();
	var loader6 = new THREE.ColladaLoader();

	loader6.load(
		// resource URL
		'models/birch_tree.dae',
		// Function when resource is loaded
		function ( geometry ) {
			tree = geometry.scene;

			//rock1.children[0].material.map = THREE.ImageUtils.loadTexture('models/house_wall.jpg');
			tree.rotation.set(-Math.PI/2,0, Math.PI/2);
			tree.scale.set( 50, 50, 50);
			tree.position.set(-500,0,80);
			tree.children[0].receiveShadow = true;//shadow
			tree.children[0].castShadow = true;

			scene.add( tree );
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		}
	);

	tree2 = new THREE.Mesh();
	var loader6 = new THREE.ColladaLoader();

	loader6.load(
		// resource URL
		'models/birch_tree.dae',
		// Function when resource is loaded
		function ( geometry ) {
			tree2 = geometry.scene;

			//rock1.children[0].material.map = THREE.ImageUtils.loadTexture('models/house_wall.jpg');
			tree2.rotation.set(-Math.PI/2,0, Math.PI/2);
			tree2.scale.set( 50, 50, 50);
			tree2.position.set(-550,0,320);
			tree2.children[0].receiveShadow = true;//shadow
			tree2.children[0].castShadow = true;

			scene.add( tree2 );
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		}
	);

	tree3 = new THREE.Mesh();
	var loader6 = new THREE.ColladaLoader();

	loader6.load(
		// resource URL
		'models/birch_tree.dae',
		// Function when resource is loaded
		function ( geometry ) {
			tree3 = geometry.scene;

			//rock1.children[0].material.map = THREE.ImageUtils.loadTexture('models/house_wall.jpg');
			tree3.rotation.set(-Math.PI/2,0, Math.PI/2);
			tree3.scale.set( 30, 30, 30);
			tree3.position.set(-170,0,-280);
			tree3.children[0].receiveShadow = true;//shadow
			tree3.children[0].castShadow = true;

			scene.add( tree3 );
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
			$('#intro-content').html(Math.round(xhr.loaded / xhr.total * 100) + '% loaded');//loading screen
			if((xhr.loaded / xhr.total)==1){
				$('#intro-content').fadeOut();
				$('#intro').fadeOut();
				$('#radar, #hud, #credits, #fog, #rain, #snow, #dusk').fadeIn();
				// Artificial Intelligence
				setupAI();
			}
		}
	);

	

   ////////////Set Up ColladaLoader end////////////////------------------------------------------

   ///////////sky dome/////////////////---------------
	var skyGeo = new t.SphereGeometry(2000, 50, 50);
	//var skyTexture = t.ImageUtils.loadTexture('images/sky.jpg');
	var skyMaterial = new t.MeshBasicMaterial({map: t.ImageUtils.loadTexture('images/sky.jpg'), overdraw: true});

	sky = new t.Mesh(skyGeo, skyMaterial);
	sky.position.set(0,500,0);
	//sky.skyMaterial= t.DoubleSide;
	sky.doubleSided = true;
	scene.add(sky);
  /////////sky dome end///////////////-----------------

	// World objects
  
	setupScene();
	

	
	// Handle drawing as WebGL (faster than Canvas but less supported)
	renderer = new t.WebGLRenderer();
	renderer.setSize(WIDTH, HEIGHT);
	//setup shadow-----------------------------
	renderer.shadowMapEnabled = true;
	
	// Add the canvas to the document
	//renderer.domElement.style.backgroundColor = '#D6F1FF'; // easier to see / sky color
	document.body.appendChild(renderer.domElement);
	
	// Track mouse position so we know where to shoot
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	
	// Shoot on click
	$(document).click(function(e) {
		e.preventDefault;// 阻止浏览器默认动作
		console.log("y="+mouse.y+"x="+mouse.x);
		if (e.which === 1 && (mouse.y>=-0.88 || mouse.x<-0.59 || mouse.x>0.19) && wingame==false && losegame==false ) { // Left click only
			console.log("win="+wingame+"lose="+losegame);
			createBullet();
		}
	});
	
	// Display HUD
	$('body').append('<canvas id="radar" width="200" height="200" style="display: none;" ></canvas>');
	$('body').append('<div id="hud" style="display: none;"><p>Health: <span id="health">100</span><br />Score: <span id="score">0</span></p></div>');
	$('body').append('<div id="credits" style="display: none;"><p><br />WASD to move, mouse to look, click to shoot</p></div>');
	$('body').append('<div class="buttons" ><div id="fog" style="display: none;">Fog</div><div id="rain" style="display: none;">Rain</div><div id="snow" style="display: none;">Snow</div><div id="dusk" style="display: none;">Dusk</div></div>');

	// Set up "hurt" flash
	$('body').append('<div id="hurt"></div>');
	$('#hurt').css({width: WIDTH, height: HEIGHT,});
  
}

// Helper function for browser frames
function animate() {
	if (runAnim) {
		requestAnimationFrame(animate);
	}
	render();
}

// Update and display !!!Set animation here!!!!!
var pSpeed = 0;
var rainFlag = -1;
var snowFlag = -1;
var duskFlag = -1;

function render() {
	var delta = clock.getDelta(), speed = delta * BULLETMOVESPEED;
	var aispeed = delta * MOVESPEED;
	if(mouse.y<-0.88){
		controls.lookSpeed = 0;
		//console.log("y="+mouse.y);
		console.log("LOOKSPEED"+controls.lookSpeed);
	}
	else{
		controls.lookSpeed = LOOKSPEED;
	}
	controls.update(delta); // Move camera

	//gun.lookAt( mouse3D);

///////////////effects//////////////////------------------------------------

   //click events

	$('#fog').unbind('click').click(function() {
	 fogEffect=-fogEffect;
	 console.log("fog="+fogEffect);
	});

	$('#rain').unbind('click').click(function(){
	 rainEffect=-rainEffect;
	 rainFlag=-rainFlag;
	 snowEffect=-1;
	 console.log("rain="+rainEffect+"snow="+snowEffect);
	});

	$('#snow').unbind('click').click(function(){
	 snowEffect=-snowEffect;
	 snowFlag=-snowFlag;
	 rainEffect=-1;
	 console.log("snow="+snowEffect+"rain="+rainEffect);
	});

	$('#dusk').unbind('click').click(function(){
	 duskEffect=-duskEffect;
	 duskFlag=-duskFlag;
	 console.log("duskEffect="+duskEffect+"duskFlag="+duskFlag);
	});

  //controls
	if(fogEffect==1){
		document.getElementById ('fog').style.background="#F39E4A";
		scene.fog = new t.FogExp2(0xD6F1FF, 0.002); // color, density
		//console.log("run fog");
	}
	else if (fogEffect==-1){
		document.getElementById ('fog').style.background="#EEEEEE";
		scene.fog = new t.FogExp2(0xD6F1FF, 0.0000001); // color, density
		//console.log("run fog else");
	}


	if( rainEffect==1 && rainFlag==1 ){
		//$('#rain').css({background-color:#F39E4A});
		document.getElementById ('rain').style.background="#F39E4A";
		document.getElementById ('snow').style.background="#EEEEEE";
		//pMap = THREE.ImageUtils.loadTexture("images/raindrop.png");
		particleSystem.material.map = THREE.ImageUtils.loadTexture('images/raindrop.png',{},function(){
           //add callback here if you want
        });
		scene.add(particleSystem);
		rainsound.volume = 1;
		rainsound.play();
		windsound.pause();
		pSpeed=0.9;
		console.log("run rain============================================cannot loop");
		rainFlag=-1;
	}
	else if ( rainEffect==1 && rainFlag==-1 ){
	//console.log("run rain else, not loop rain");
	}
	else if ( rainEffect==-1 && snowEffect==-1 ){
		//$('#rain').css({background-color:#EEEEEE});
		document.getElementById ('rain').style.background="#EEEEEE";
		scene.remove(particleSystem);
		rainsound.pause();
		rainFlag=-1;
		//console.log("remove rain!!!!!!!!!!!!!!!!!!!");
	}


	if( snowEffect==1 && snowFlag==1 ){
		document.getElementById ('snow').style.background="#F39E4A";
		document.getElementById ('rain').style.background="#EEEEEE";
		//pMap = THREE.ImageUtils.loadTexture("images/snowflake.png");
		particleSystem.material.map = THREE.ImageUtils.loadTexture('images/snowflake.png',{},function(){
           //add callback here if you want
        });
		scene.add(particleSystem);
		windsound.play();
		rainsound.pause();
		pSpeed=0.1;
		console.log("run snow============================================");
		snowFlag=-1;
	}
	else if ( snowEffect==1 && snowFlag==-1 ){
	//console.log("run snow else, not loop snow");
	}
	else if ( snowEffect==-1 && rainEffect==-1 ){
		document.getElementById ('snow').style.background="#EEEEEE";
		scene.remove(particleSystem);
		windsound.pause();
		snowFlag=-1;
		//console.log("remove snow!!!!!!!!!!!!!!!!!!!");
	}


	if(duskEffect == 1 && duskFlag==1){
		document.getElementById ('dusk').style.background="#F39E4A";
		sky.material.map = THREE.ImageUtils.loadTexture('images/dusk2.jpg',{},function(){
	           //add callback here if you want
	        });
		duskFlag = -1;
		console.log("run dusk=======================================");
	}
	else if(duskEffect == 1 && duskFlag == -1){
		//console.log("run dusk else, not loop dusk");
	}
	else if (duskEffect==-1 && duskFlag ==1){
		document.getElementById ('dusk').style.background="#EEEEEE";
		sky.material.map = THREE.ImageUtils.loadTexture('images/sky.jpg',{},function(){
	           //add callback here if you want
	        });
		duskFlag = -1;
		console.log("run sky=======================================");
		console.log("duskEffect="+duskEffect+"duskFlag="+duskFlag);
	}
	else if (duskEffect==-1 && duskFlag == -1){
		duskFlag == -1;
		//console.log("run sky else, not loop sky");
	}
///////////////effects end//////////////////------------------------------------
	

///////////////////Paticle animation://///////////////////////

	// rain add some rotation to the system
  	particleSystem.rotation.y += 0.005;

  	var pCount = particleCount;
  while (pCount--) {

    // get the particle
    var particle =
      particles.vertices[pCount];

    // check if we need to reset
    if (particle.y < 0) {
      particle.y = 1000;
      particle.velocity.y = 0; //Vector3 porperty has changed!!!no particle.position.y
    }

    // update the velocity with
    // a splat of randomniz
    particle.velocity.y -= Math.random() * pSpeed;

    // and the position
    particle.y+=particle.velocity.y;//particle.position.addSelf(particle.velocity); Change the function!!! not this one
  }

  // flag to the particle system
  // that we've changed its vertices.
  particleSystem.
    geometry.
    __dirtyVertices = true;

////////////Paticle animation end////////////////----------------------------
	
	
	// Rotate the health cube
	healthcube.rotation.x += 0.004
	healthcube.rotation.y += 0.008;
	// Allow picking it up once per minute
	
	if (Date.now() > lastHealthPickup + 60000) {
		if (distance(cam.position.x, cam.position.z, healthcube.position.x, healthcube.position.z) < 15 && health != 100) {
			health = Math.min(health + 50, 100);
			$('#health').html(health);
			lastHealthPickup = Date.now();
		}
		healthcube.material.wireframe = false;

	}
	else {
		healthcube.material.wireframe = true;
		if(pickuphealthPlay==1){
		pickhealth.play();
		pickuphealthPlay = -1;
		}
	}

	// Update bullets. Walk backwards through the list so we can remove items.
	for (var i = bullets.length-1; i >= 0; i--) {
		var b = bullets[i], p = b.position, d = b.ray.direction;
		if (checkWallCollision(p)) {
			bullets.splice(i, 1);
			scene.remove(b);
			continue;
		}
		// Collide with AI
		var hit = false;
		for (var j = ai.length-1; j >= 0; j--) {
			var a = ai[j];
			var v = a.geometry.vertices[0];
			var c = a.position;
			var x = Math.abs(v.x), z = Math.abs(v.z);
			//console.log(Math.round(p.x), Math.round(p.z), c.x, c.z, x, z);
			if (p.x < c.x + x && p.x > c.x - x &&
					p.z < c.z + z && p.z > c.z - z &&
					b.owner != a) {
				bullets.splice(i, 1);
				scene.remove(b);
				a.health -= PROJECTILEDAMAGE;
				var color = a.material.color, percent = a.health / 100;
				a.material.color.setRGB(
						percent * color.r,
						percent * color.g,
						percent * color.b
				);
				hit = true;
				break;
			}
		}
		// Bullet hits player
		if (distance(p.x, p.z, cam.position.x, cam.position.z) < 25 && b.owner != cam) {
			hurtwarn.play();
			$('#hurt').fadeIn(75);
			//health -= 10;//调试先注释
			if (health < 0) health = 0;
			val = health < 25 ? '<span style="color: darkRed">' + health + '</span>' : health;
			$('#health').html(val);
			bullets.splice(i, 1);
			scene.remove(b);
			$('#hurt').fadeOut(350);
		}
		if (!hit) {
			b.translateX(speed * d.x);
			//bullets[i].translateY(speed * bullets[i].direction.y);
			b.translateZ(speed * d.z);
		}
	}
	
	// Update AI.
	for (var i = ai.length-1; i >= 0; i--) {
		var a = ai[i];
		if (a.health <= 0) {
			ai.splice(i, 1);
			scene.remove(a);
			scream.volume = 1;
			scream.play();
			kills++;
			$('#score').html(kills * 100);
			addAI();
		}
		// Move AI
		var r = Math.random();
		if (r > 0.995) {
			a.lastRandomX = Math.random() * 2 - 1;
			a.lastRandomZ = Math.random() * 2 - 1;
		}
		a.translateX(aispeed * a.lastRandomX);
		a.translateZ(aispeed * a.lastRandomZ);
		var c = getMapSector(a.position);
		if (c.x < 0 || c.x >= mapW || c.y < 0 || c.y >= mapH || checkWallCollision(a.position)) {
			a.translateX(-2 * aispeed * a.lastRandomX);
			a.translateZ(-2 * aispeed * a.lastRandomZ);
			a.lastRandomX = Math.random() * 2 - 1;
			a.lastRandomZ = Math.random() * 2 - 1;
		}
		if (c.x < -1 || c.x > mapW || c.z < -1 || c.z > mapH) {
			ai.splice(i, 1);
			scene.remove(a);
			addAI();
		}
		/*
		var c = getMapSector(a.position);
		if (a.pathPos == a.path.length-1) {
			console.log('finding new path for '+c.x+','+c.z);
			a.pathPos = 1;
			a.path = getAIpath(a);
		}
		var dest = a.path[a.pathPos], proportion = (c.z-dest[1])/(c.x-dest[0]);
		a.translateX(aispeed * proportion);
		a.translateZ(aispeed * 1-proportion);
		console.log(c.x, c.z, dest[0], dest[1]);
		if (c.x == dest[0] && c.z == dest[1]) {
			console.log(c.x+','+c.z+' reached destination');
			a.PathPos++;
		}
		*/
		var cc = getMapSector(cam.position);
		if (Date.now() > a.lastShot + 750 && distance(c.x, c.z, cc.x, cc.z) < 2) {
			createBullet(a);
			a.lastShot = Date.now();
		}
	}

	renderer.render(scene, cam); // Repaint

	//win

	if(kills==4){	
		runAnim = false;
		bgmusic.pause();
		windsound.pause();
		rainsound.pause();
		winsound.play();
		$(renderer.domElement).fadeOut();
		$('#radar, #hud, #credits, #fog, #rain, #snow, #dusk').fadeOut();
		$('#intro').fadeIn();
		$('#intro-content').fadeIn();
		$('#intro-content').html('You Win!!! Click here to restart...');
		$('#intro-content').one('click', function() {
			location = location;
			wingame = true;
			/*
			$(renderer.domElement).fadeIn();
			$('#radar, #hud, #credits').fadeIn();
			$(this).fadeOut();
			runAnim = true;
			animate();
			health = 100;
			$('#health').html(health);
			kills--;
			if (kills <= 0) kills = 0;
			$('#score').html(kills * 100);
			cam.translateX(-cam.position.x);
			cam.translateZ(-cam.position.z);
			*/
		});
		//wingame = false;
	}
	
	// Death
	if (health <= 0) {
		runAnim = false;
		bgmusic.pause();
		windsound.pause();
		rainsound.pause();
		losesound.play();
		$(renderer.domElement).fadeOut();
		$('#radar, #hud, #credits, #fog, #rain, #snow, #dusk').fadeOut();
		$('#intro').fadeIn();
		$('#intro-content').fadeIn();
		$('#intro-content').html('Ouch! Click here to restart...');
		console.log("lose2="+losegame);
		$('#intro-content').one('click', function() {
			location = location;
			losegame = true;
			
			console.log("lose3="+losegame);
		});
		//losegame = false;
	}
}

// Set up the objects in the world
function setupScene() {
	var UNITSIZE = 250, units = mapW;

	// Geometry: floor
	var floor = new t.Mesh(
			new t.CubeGeometry(units * UNITSIZE, 10, units * UNITSIZE),
			new t.MeshLambertMaterial({color: 0xEDCBA0,/*map: t.ImageUtils.loadTexture('images/snow-512.jpg')*/transparent: true})
	);
	//floor.material.opacity = 0.5;
	floor.receiveShadow = true;//shadow
	scene.add(floor);
	
	// Geometry: walls
	var cube = new t.CubeGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE);
	var materials = [
	                 new t.MeshLambertMaterial({/*color: 0x00CCAA,*/map: t.ImageUtils.loadTexture('images/wall-1.jpg'), transparent: true}),
	                 new t.MeshLambertMaterial({/*color: 0xC5EDA0,*/map: t.ImageUtils.loadTexture('images/wall-2.jpg'), transparent: true}),
	                 new t.MeshLambertMaterial({color: 0xFBEBCD}),
	                 ];
	for (var i = 0; i < mapW; i++) {
		for (var j = 0, m = map2[i].length; j < m; j++) {
			if (map2[i][j]) {
				var wall = new t.Mesh(cube, materials[map2[i][j]-1]);
				wall.position.x = (i - units/2) * UNITSIZE;
				wall.position.y = WALLHEIGHT/2;
				wall.position.z = (j - units/2) * UNITSIZE;
				wall.receiveShadow = true;//shadow
				wall.castShadow = true;
				//wall.material.wireframe = true;//frame
				//wall.material.opacity = 0.5;
				scene.add(wall);
			}
		}
	}
	
	// Health cube
	healthcube = new t.Mesh(
			new t.CubeGeometry(30, 30, 30),
			new t.MeshBasicMaterial({map: t.ImageUtils.loadTexture('images/health.png')})
	);
	healthcube.position.set(-UNITSIZE-15, 35, -UNITSIZE-15);
	healthcube.receiveShadow = true;//shadow
	healthcube.castShadow = true;
	scene.add(healthcube);
	
	// Lighting
	var directionalLight1 = new t.DirectionalLight( 0xF7EFBE, 1 );
	directionalLight1.position.set( 0.5, 1, 0.5 );
		//----shadow--------------------------------
	directionalLight1.castShadow = true;
	directionalLight1.shadowMapWidth = 2048;
	directionalLight1.shadowMapHeight = 2048;
	var d = 1000;
	directionalLight1.shadowCameraLeft = d;
	directionalLight1.shadowCameraRight = -d;
	directionalLight1.shadowCameraTop = d;
	directionalLight1.shadowCameraBottom = -d;
	directionalLight1.shadowCameraFar = 2500;
	//directionalLight1.shadowCameraVisible = true;
	//-----------------------------------------------
	scene.add( directionalLight1 );

	var directionalLight2 = new t.DirectionalLight( 0xF7EFBE, 1);
	directionalLight2.position.set( -0.5, -1, -0.5 );

	directionalLight2.castShadow = true;
	directionalLight2.shadowMapWidth = 2048;
	directionalLight2.shadowMapHeight = 2048;
	directionalLight2.shadowCameraLeft = d;
	directionalLight2.shadowCameraRight = -d;
	directionalLight2.shadowCameraTop = d;
	directionalLight2.shadowCameraBottom = -d;
	directionalLight2.shadowCameraFar = 2500;
	directionalLight2.shaowCameraVisible = true;

	scene.add( directionalLight2 );

	

}

var ai = [];
var aiGeo = new t.CubeGeometry(40, 40, 40);
function setupAI() {
	for (var i = 0; i < NUMAI; i++) {
		addAI();
	}
}

function addAI() {
	var c = getMapSector(cam.position);
	var aiMaterial = new t.MeshBasicMaterial({/*color: 0xEE3333,*/map: t.ImageUtils.loadTexture('images/face.png')});
	var o = new t.Mesh(aiGeo, aiMaterial);
	do {
		var x = getRandBetween(0, mapW-1);
		var z = getRandBetween(0, mapH-1);
	} while (map[x][z] > 0 || (x == c.x && z == c.z));
	x = Math.floor(x - mapW/2) * UNITSIZE;
	z = Math.floor(z - mapW/2) * UNITSIZE;
	o.position.set(x, UNITSIZE * 0.15, z);
	o.health = 100;
	//o.path = getAIpath(o);
	o.pathPos = 1;
	o.lastRandomX = Math.random();
	o.lastRandomZ = Math.random();
	o.lastShot = Date.now(); // Higher-fidelity timers aren't a big deal here.
	o.receiveShadow = true;//shadow
	o.castShadow = true;
	ai.push(o);
	scene.add(o);
}

function getAIpath(a) {
	var p = getMapSector(a.position);
	do { // Cop-out
		do {
			var x = getRandBetween(0, mapW-1);
			var z = getRandBetween(0, mapH-1);
		} while (map[x][z] > 0 || distance(p.x, p.z, x, z) < 3);
		var path = findAIpath(p.x, p.z, x, z);
	} while (path.length == 0);
	return path;
}

/**
 * Find a path from one grid cell to another.
 *
 * @param sX
 *   Starting grid x-coordinate.
 * @param sZ
 *   Starting grid z-coordinate.
 * @param eX
 *   Ending grid x-coordinate.
 * @param eZ
 *   Ending grid z-coordinate.
 * @returns
 *   An array of coordinates including the start and end positions representing
 *   the path from the starting cell to the ending cell.
 */
function findAIpath(sX, sZ, eX, eZ) {
	var backupGrid = grid.clone();
	var path = finder.findPath(sX, sZ, eX, eZ, grid);
	grid = backupGrid;
	return path;
}

function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

function getMapSector(v) {
	var x = Math.floor((v.x + UNITSIZE / 2) / UNITSIZE + mapW/2);
	var z = Math.floor((v.z + UNITSIZE / 2) / UNITSIZE + mapW/2);
	return {x: x, z: z};
}

/**
 * Check whether a Vector3 overlaps with a wall.
 *
 * @param v
 *   A THREE.Vector3 object representing a point in space.
 *   Passing cam.position is especially useful.
 * @returns {Boolean}
 *   true if the vector is inside a wall; false otherwise.
 */
function checkWallCollision(v) { //!!!
	var c = getMapSector(v);
	return map[c.x][c.z] > 0;
}

// Radar
function drawRadar() {
	var c = getMapSector(cam.position), context = document.getElementById('radar').getContext('2d');
	context.font = '10px Helvetica';
	for (var i = 0; i < mapW; i++) {
		for (var j = 0, m = map[i].length; j < m; j++) {
			var d = 0;
			for (var k = 0, n = ai.length; k < n; k++) {
				var e = getMapSector(ai[k].position);
				if (i == e.x && j == e.z) {
					d++;
				}
			}
			if (i == c.x && j == c.z && d == 0) {
				context.fillStyle = '#0000FF';
				context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
			}
			else if (i == c.x && j == c.z) {
				context.fillStyle = '#AA33FF';
				context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
				context.fillStyle = '#000000';
				context.fillText(''+d, i*20+8, j*20+12);
			}
			else if (d > 0 && d < 10) {
				context.fillStyle = '#FF0000';
				context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
				context.fillStyle = '#000000';
				context.fillText(''+d, i*20+8, j*20+12);
			}
			else if (map[i][j] > 0) {
				context.fillStyle = '#666666';
				context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
			}
			else {
				context.fillStyle = '#CCCCCC';
				context.fillRect(i * 20, j * 20, (i+1)*20, (j+1)*20);
			}
		}
	}
}

var bullets = [];
var sphereMaterial = new t.MeshBasicMaterial({map: t.ImageUtils.loadTexture('images/fire.jpg')});
var sphereGeo = new t.SphereGeometry(2, 6, 6);

//var spriteMaterial = new t.SpriteMaterial( { map: t.ImageUtils.loadTexture('images/sprites.png') } );

function createBullet(obj) {
	if (obj === undefined) {
		obj = cam;
	}
	var sphere = new t.Mesh(sphereGeo, sphereMaterial);
	sphere.position.set(obj.position.x, obj.position.y * 0.8, obj.position.z);

	//---sprite
	/*var fire = new t.Sprite( spriteMaterial );
	fire.scale.set(2,6,6);
	fire.position.set(obj.position.x, obj.position.y * 0.8, obj.position.z);
	fire.transparent = true;*/

	if (obj instanceof t.Camera) {
		var vector = new t.Vector3(mouse.x, mouse.y, 1);
		projector.unprojectVector(vector, obj);
		sphere.ray = new t.Ray(
				obj.position,
				vector.subSelf(obj.position).normalize()
		);
	}
	else {
		var vector = cam.position.clone();
		sphere.ray = new t.Ray(
				obj.position,
				vector.subSelf(obj.position).normalize()//change
		);
	}
	sphere.owner = obj;
	
	//sphere.add(fire);
	bullets.push(sphere);
	scene.add(sphere);
	blast.play(0);
	return sphere;
}

/*
function loadImage(path) {
	var image = document.createElement('img');
	var texture = new t.Texture(image, t.UVMapping);
	image.onload = function() { texture.needsUpdate = true; };
	image.src = path;
	return texture;
}
*/

function onDocumentMouseMove(e) {
	e.preventDefault();
	mouse.x = (e.clientX / WIDTH) * 2 - 1;
	mouse.y = - (e.clientY / HEIGHT) * 2 + 1;
}

// Handle window resizing
$(window).resize(function() {
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
	ASPECT = WIDTH / HEIGHT;
	if (cam) {
		cam.aspect = ASPECT;
		cam.updateProjectionMatrix();
	}
	if (renderer) {
		renderer.setSize(WIDTH, HEIGHT);
	}
	$('#intro, #hurt').css({width: WIDTH, height: HEIGHT,});
});

// Stop moving around when the window is unfocused (keeps my sanity!)
$(window).focus(function() {
	if (controls) controls.freeze = false;
});
$(window).blur(function() {
	if (controls) controls.freeze = true;
});

//Get a random integer between lo and hi, inclusive.
//Assumes lo and hi are integers and lo is lower than hi.
function getRandBetween(lo, hi) {
 return parseInt(Math.floor(Math.random()*(hi-lo+1))+lo, 10);
}



