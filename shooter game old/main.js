/**
 * Notes:
 * - Coordinates are specified as (X, Y, Z) where X and Z are horizontal and Y
 *   is vertical
 */

var map = [ // 1  2  3  4  5  6  7  8  9
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 0
           [1, 1, 0, 0, 0, 0, 0, 1, 1, 1,], // 1
           [1, 1, 0, 0, 2, 0, 0, 0, 0, 1,], // 2
           [1, 0, 0, 0, 0, 2, 0, 0, 0, 1,], // 3
           [1, 0, 0, 2, 0, 0, 2, 0, 0, 1,], // 4
           [1, 0, 0, 0, 2, 0, 0, 0, 1, 1,], // 5
           [1, 1, 1, 0, 0, 0, 0, 1, 1, 1,], // 6
           [1, 1, 1, 0, 0, 1, 0, 0, 1, 1,], // 7
           [1, 1, 1, 1, 1, 1, 0, 0, 1, 1,], // 8
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 9
           ], mapW = map.length, mapH = map[0].length;

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
var healthCube, lastHealthPickup = 0;
/*
var finder = new PF.AStarFinder({ // Defaults to Manhattan heuristic
	allowDiagonal: true,
}), grid = new PF.Grid(mapW, mapH, map);
*/

// Initialize and run on document ready
$(document).ready(function() {
	$('body').append('<div id="intro">Click to start</div>');
	$('#intro').css({width: WIDTH, height: HEIGHT}).one('click', function(e) {
		e.preventDefault();
		$(this).fadeOut();
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
//particle varibles----------------------------------
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
//---------------------------------------------------				

function init() {
	clock = new t.Clock(); // Used in render() for controls.update()
	projector = new t.Projector(); // Used in bullet projection
	scene = new t.Scene(); // Holds all objects in the canvas

	//set up particle--------------------------------------------
	

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

//sky dome---------------
	var skyGeo = new t.SphereGeometry(2000, 50, 50);
	//var skyTexture = t.ImageUtils.loadTexture('images/sky.jpg');
	var skyMaterial = new t.MeshBasicMaterial({map: t.ImageUtils.loadTexture('images/sky.jpg'), overdraw: true});

	sky = new t.Mesh(skyGeo, skyMaterial);
	sky.position.set(0,500,0);
	//sky.skyMaterial= t.DoubleSide;
	sky.doubleSided = true;
	scene.add(sky);
//---------------------------

	// World objects
	setupScene();
	
	// Artificial Intelligence
	setupAI();
	
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
		e.preventDefault;
		if (e.which === 1) { // Left click only
			createBullet();
		}
	});
	
	// Display HUD
	$('body').append('<canvas id="radar" width="200" height="200"></canvas>');
	$('body').append('<div id="hud"><p>Health: <span id="health">100</span><br />Score: <span id="score">0</span></p></div>');
	$('body').append('<div id="credits"><p><br />WASD to move, mouse to look, click to shoot</p></div>');
	$('body').append('<div class="buttons"><div id="fog">Fog</div><div id="rain">Rain</div><div id="snow">Snow</div><div id="dusk">Dusk</div></div>');

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
	controls.update(delta); // Move camera

	//effects------------------------------------------------------

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
	scene.fog = new t.FogExp2(0xD6F1FF, 0.002); // color, density
	console.log("run fog");
	}
	else if (fogEffect==-1){
	scene.fog = new t.FogExp2(0xD6F1FF, 0.0000001); // color, density
	console.log("run fog else");
	}

	if( rainEffect==1 && rainFlag==1 ){
		//pMap = THREE.ImageUtils.loadTexture("images/raindrop.png");
		particleSystem.material.map = THREE.ImageUtils.loadTexture('images/raindrop.png',{},function(){
           //add callback here if you want
        });
		scene.add(particleSystem);
		pSpeed=0.9;
		console.log("run rain============================================cannot loop");
		rainFlag=-1;
	}
	else if ( rainEffect==1 && rainFlag==-1 ){
	console.log("run rain else, not loop rain");
	}
	else if ( rainEffect==-1 && snowEffect==-1 ){
		scene.remove(particleSystem);
		rainFlag=-1;
		console.log("remove rain!!!!!!!!!!!!!!!!!!!");
	}

	if( snowEffect==1 && snowFlag==1 ){
		//pMap = THREE.ImageUtils.loadTexture("images/snowflake.png");
		particleSystem.material.map = THREE.ImageUtils.loadTexture('images/snowflake.png',{},function(){
           //add callback here if you want
        });
		scene.add(particleSystem);
		pSpeed=0.1;
		console.log("run snow============================================");
		snowFlag=-1;
	}
	else if ( snowEffect==1 && snowFlag==-1 ){
	console.log("run snow else, not loop snow");
	}
	else if ( snowEffect==-1 && rainEffect==-1 ){
		scene.remove(particleSystem);
		snowFlag=-1;
		console.log("remove snow!!!!!!!!!!!!!!!!!!!");
	}

	if(duskEffect == 1 && duskFlag==1){
		sky.material.map = THREE.ImageUtils.loadTexture('images/dusk2.jpg',{},function(){
	           //add callback here if you want
	        });
		duskFlag = -1;
		console.log("run dusk=======================================");
	}
	else if(duskEffect == 1 && duskFlag == -1){
		console.log("run dusk else, not loop dusk");
	}
	else if (duskEffect==-1 && duskFlag ==1){
		sky.material.map = THREE.ImageUtils.loadTexture('images/sky.jpg',{},function(){
	           //add callback here if you want
	        });
		duskFlag = -1;
		console.log("run sky=======================================");
		console.log("duskEffect="+duskEffect+"duskFlag="+duskFlag);
	}
	else if (duskEffect==-1 && duskFlag == -1){
		duskFlag == -1;
		console.log("run sky else, not loop sky");
	}
	
//////Paticle animation://///

	// rain add some rotation to the system
  	particleSystem.rotation.y += 0.005;

  	var pCount = particleCount;
  while (pCount--) {

    // get the particle
    var particle =
      particles.vertices[pCount];

    // check if we need to reset
    if (particle.y < -200) {
      particle.y = 200;
      particle.velocity.y = 0; //Vector3 porperty has changed!!!
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

	//---------------------------------------------------------------
	
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
			$('#hurt').fadeIn(75);
			health -= 10;
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
		$(renderer.domElement).fadeOut();
		$('#radar, #hud, #credits, #fog, #rain, #snow, #dusk').fadeOut();
		$('#intro').fadeIn();
		$('#intro').html('You Win!!! Click to restart...');
		$('#intro').one('click', function() {
			location = location;
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
	}
	
	// Death
	if (health <= 0) {
		runAnim = false;
		$(renderer.domElement).fadeOut();
		$('#radar, #hud, #credits, #fog, #rain, #snow, #dusk').fadeOut();
		$('#intro').fadeIn();
		$('#intro').html('Ouch! Click to restart...');
		$('#intro').one('click', function() {
			location = location;
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
	}
}

// Set up the objects in the world
function setupScene() {
	var UNITSIZE = 250, units = mapW;

	// Geometry: floor
	var floor = new t.Mesh(
			new t.CubeGeometry(units * UNITSIZE, 10, units * UNITSIZE),
			new t.MeshLambertMaterial({color: 0xEDCBA0,/*map: t.ImageUtils.loadTexture('images/snow-512.jpg')*/})
	);
	floor.receiveShadow = true;//shadow
	scene.add(floor);
	
	// Geometry: walls
	var cube = new t.CubeGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE);
	var materials = [
	                 new t.MeshLambertMaterial({/*color: 0x00CCAA,*/map: t.ImageUtils.loadTexture('images/wall-1.jpg')}),
	                 new t.MeshLambertMaterial({/*color: 0xC5EDA0,*/map: t.ImageUtils.loadTexture('images/wall-2.jpg')}),
	                 new t.MeshLambertMaterial({color: 0xFBEBCD}),
	                 ];
	for (var i = 0; i < mapW; i++) {
		for (var j = 0, m = map[i].length; j < m; j++) {
			if (map[i][j]) {
				var wall = new t.Mesh(cube, materials[map[i][j]-1]);
				wall.position.x = (i - units/2) * UNITSIZE;
				wall.position.y = WALLHEIGHT/2;
				wall.position.z = (j - units/2) * UNITSIZE;
				wall.receiveShadow = true;//shadow
				wall.castShadow = true;
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
	directionalLight1.shaowCameraVisible = true;
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
function checkWallCollision(v) {
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



