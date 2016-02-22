// GLOBALS ====================================================================

var scene, renderer, camera, clock, player;

var HORIZONTAL_UNIT = 100,
			VERTICAL_UNIT = 100,
		INV_MAX_FPS = 1 / 100,
		FIRING_DELAY = 1000,
		BOT_MAX_AXIAL_ERROR = 10,
		BOT_MOVE_DELAY = 2000;
var frameDelta = 0,
		paused = true;
var spawnPoints = [];
var floor;
var bullets = [],
		deadBulletPool = [];
var enemies = [],
		numEnemies = 5;

var USE_EDGE_EFFECT = false;

// MAPS =======================================================================

var map = "   XXXXXXXX     XXXXXXXX      \n" +
					"   X      X     X      X      \n" +
					"   X  S   X     X   R  X      \n" +
					"   X      XXXXXXX      X      \n" +
					"   X                  XXXXXXXX\n" +
					"   X         S               X\n" +
					"   XXXX XX       XXXX    S   X\n" +
					"      X XX       X  X        X\n" +
					"   XXXX XXX     XX  X        X\n" +
					"   X      XX   XXXXXXTTXX  XXX\n" +
					"   X      XTTTTTXXXTTTTXX  X  \n" +
					"   XX  S  XTTTTTXXTTTTTXX  XXX\n" +
					"XXXXX     XTTTTTXTTTTTTX     X\n" +
					"X      XTTXTTTTTTTTTTTTX     X\n" +
					"X  S  XXTTTTTTTTXTTTTTXX  S  X\n" +
					"X     XTTTTTTTTTXTTTTTX      X\n" +
					"X     TTTTTTTTTTXXXXTTX  XXXXX\n" +
					"X     XTTTTTTTTTX X      X    \n" +
					"XX  XXXTTTTTTTTTX X      X    \n" +
					" X  X XTTTTTTTTTX X      X    \n" +
					" X  XXX         X X      X    \n" +
					" X             XXXX      XX   \n" +
					" XXXXX    T               X   \n" +
					"     X                 S  X   \n" +
					"     XX   B  XXXXXXXX     X   \n" +
					"      XX    XX      XXXXXXX   \n" +
					"       XXXXXX                 ";
map = map.split("\n");
var ZSIZE = map.length * HORIZONTAL_UNIT,
		XSIZE = map[0].length * HORIZONTAL_UNIT;
var meshMap = new Array(map.length);

function MapCell() {
	this.set.apply(this, arguments);
}
MapCell.prototype.set = function(row, col, char, mesh) {
	this.row = row;
	this.col = col;
	this.char = char;
	this.mesh = mesh;
	return this;
};

// ANIMATION LOOP =============================================================

function animate() {
	draw();

	frameDelta += clock.getDelta();
	while (frameDelta >= INV_MAX_FPS) {
		update(INV_MAX_FPS);
		frameDelta -= INV_MAX_FPS;
	}

	if (!paused) {
		requestAnimationFrame(animate);
	}
}

function startAnimating() {
	if (paused) {
		paused = false;
		clock.start();
		requestAnimationFrame(animate);
	}
}

function stopAnimating() {
	paused = true;
	clock.stop();
}

// SETUP ======================================================================

function setup() {
	setupThreeJS();
	setupWorld();
	setupEnemies();
	requestAnimationFrame(animate);
	spawn();
}

function setupThreeJS() {
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xdcf7e7, 0.001);

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(60, renderer.domElement.width / renderer.domElement.height, 1, 10000);
	clock = new THREE.Clock(false);

	composer = new THREE.EffectComposer(renderer);
	composer.addPass(new THREE.RenderPass(scene, camera));
	var effect = new THREE.ShaderPass(THREE.EdgeShader);
	effect.uniforms['aspect'].value.x = renderer.domElement.width;
	effect.uniforms['aspect'].value.y = renderer.domElement.height;
	composer.addPass(effect);
	effect = new THREE.ShaderPass(THREE.CopyShader);
	effect.renderToScreen = true;
	composer.addPass(effect);
}

function setupWorld() {
	setupMap();

	player = new Player(TEAMS.B);
	player.add(camera);
	player.position.y = 20;
	scene.add(player);

	var light = new THREE.DirectionalLight(0xfffaf3, 1.5);
	light.position.set(1, 1, 1);
	scene.add(light);
	light = new THREE.DirectionalLight(0xf3faff, 0.75);
	light.position.set(-1, - 0.5, -1);
	scene.add(light);
}

function setupMap() {
	for (var i = 0, rows = map.length; i < rows; i++) {
		for (var j = 0, cols = map[i].length; j < cols; j++) {
			if (typeof meshMap[i] === 'undefined') {
				meshMap[i] = new Array(cols);
			}
			meshMap[i][j] = addVoxel(map[i].charAt(j), i, j);
		}
	}

	var material = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
	var floorGeo = new THREE.PlaneGeometry(XSIZE, ZSIZE, 20, 20);
	floor = new THREE.Mesh(floorGeo, material);
	floor.rotation.x = Math.PI * -0.5;
	floor.position.set(HORIZONTAL_UNIT, 0, -HORIZONTAL_UNIT); // Ideally this wouldn't be needed
	scene.add(floor);
}

var addVoxel = (function() {
	var XOFFSET = map.length * 0.5 * HORIZONTAL_UNIT,
			ZOFFSET = map[0].length * 0.5 * HORIZONTAL_UNIT,
			materials = [];
	for (var i = 0; i < 8; i++) {
		materials.push(new THREE.MeshPhongMaterial({
			color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.3, 0.5, Math.random() * 0.25 + 0.75)
		}));
	}
	function material() {
		return materials[Math.floor(Math.random() * materials.length)].clone();
	}

	var WALL = new THREE.CubeGeometry(HORIZONTAL_UNIT, VERTICAL_UNIT, HORIZONTAL_UNIT);

	return function(type, row, col) {
		var z = (row+1) * HORIZONTAL_UNIT - ZOFFSET,
				x = (col+1) * HORIZONTAL_UNIT - XOFFSET,
				mesh;
		switch(type) {
			case ' ': break;
			case 'S':
				spawnPoints.push(new THREE.Vector3(x, 0, z));
				break;
			case 'R':
			case 'B':
				var loader = new THREE.ColladaLoader();
				loader.load('models/flag.dae', function(result) {
					result.scene.scale.set(10, 10, 10);
					result.scene.position.set(x, VERTICAL_UNIT*0.5, z);
					result.scene.children[1].material = new THREE.MeshLambertMaterial({
						color: type === 'R' ? TEAMS.R.color : TEAMS.B.color,
						side: THREE.DoubleSide,
					});
					if (type === 'B') result.scene.rotation.y = Math.PI;
					scene.add(result.scene);
					TEAMS[type].flag = new MapCell(row, col, type, result.scene);
					var cheering = new THREE.AudioObject('sounds/cheering.ogg', 0, 1, false);
					scene.add(cheering);
					TEAMS[type].cheering = cheering;
				});
				var geometry = new THREE.IcosahedronGeometry(200, 2);
				var mat = new THREE.ParticleBasicMaterial({
					color: type === 'R' ? TEAMS.R.color : TEAMS.B.color,
					size: 10,
					//blending: THREE.AdditiveBlending,
					transparent: true,
				});
				var system = new THREE.ParticleSystem(geometry, mat);
				system.sortParticles = true;
				system.position.set(x, VERTICAL_UNIT * 0.5, z);
				scene.add(system);
				system.visible = false;
				TEAMS[type].fireworks = system;
				break;
			case 'T':
				mesh = new THREE.Mesh(WALL.clone(), material());
				mesh.position.set(x, VERTICAL_UNIT*0.5, z);
				break;
			case 'X':
				mesh = new THREE.Mesh(WALL.clone(), material());
				mesh.scale.y = 3;
				mesh.position.set(x, VERTICAL_UNIT*1.5, z);
				break;
		}
		if (typeof mesh !== 'undefined') {
			scene.add(mesh);
		}
		return mesh;
	};
})();

function setupEnemies() {
	THREE.ImageUtils.loadTexture('images/face-red.png', undefined, function(red) {
		THREE.ImageUtils.loadTexture('images/face-blue.png', undefined, function(blue) {
			var geometry = new THREE.CubeGeometry(Player.RADIUS*2, Player.RADIUS*2, Player.RADIUS*2);
			var redMaterial = new THREE.MeshBasicMaterial({ map: red }),
					blueMaterial = new THREE.MeshBasicMaterial({ map: blue });
			var now = Date.now();
			var numBlue = Math.floor((numEnemies+1) * 0.5);
			for (var i = 0; i < numEnemies; i++) {
				var material = i < numBlue ? blueMaterial : redMaterial;
				var team = i < numBlue ? TEAMS.B : TEAMS.R;
				var enemy = new Player(team, geometry.clone(), material.clone());
				spawn(enemy);
				enemies.push(enemy);
				scene.add(enemy);
				enemy.lastShot = now + Math.random() * FIRING_DELAY;
				enemy.lastMove = now + Math.random() * BOT_MOVE_DELAY;
			}
		});
	});
}

window.addEventListener('resize', function() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = renderer.domElement.width / renderer.domElement.height;
	camera.updateProjectionMatrix();
	draw();
}, false);

// DRAW =======================================================================

function draw() {
	if (USE_EDGE_EFFECT) composer.render();
	else renderer.render(scene, camera);
}

// UPDATE =====================================================================

function update(delta) {
	player.update(delta);
	checkPlayerCollision(player);
	checkHasFlag(player);

	for (var i = bullets.length - 1; i >= 0; i--) {
		bullets[i].update(delta);
		checkBulletCollision(bullets[i], i);
	}

	var now = Date.now();
	for (var j = 0; j < numEnemies; j++) {
		var enemy = enemies[j];
		enemy.update(delta);
		checkPlayerCollision(enemy);
		if (enemy.health <= 0) {
			enemy.health = enemy.maxHealth;
			spawn(enemy);
		}
		if (enemy.lastShot + FIRING_DELAY <= now) {
			shoot(enemy, closestEnemy(enemy));
			enemy.lastShot = now;
		}
		if (enemy.lastMove + BOT_MOVE_DELAY <= now) {
			move(enemy);
			enemy.lastMove = now;
		}
	}

	if (player.health <= 0) {
		respawn();
	}

	for (var team in TEAMS) {
		if (TEAMS.hasOwnProperty(team) && TEAMS[team].fireworks.visible) {
			TEAMS[team].fireworks.rotation.y += delta * 1.5;
			TEAMS[team].fireworks.rotation.x += delta * 1.0;
			var scale = 1 + 0.4 * delta;
			TEAMS[team].fireworks.scale.multiplyScalar(scale);
		}
	}
}

function spawn(unit) {
	unit = unit || player;
	if (unit.hasFlag) {
		unit.hasFlag = false;
		var otherFlag = unit.team === TEAMS.R ? TEAMS.R.flag : TEAMS.B.flag;
		otherFlag.mesh.traverse(function(node) {
			node.visible = true;
		});
		console.log('The ' + unit.team === TEAMS.R ? TEAMS.B.name : TEAMS.R.name + ' flag has been returned!');
	}
	var cell = new MapCell(), point;
	do {
		point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
		mapCellFromPosition(point, cell);
	} while (isPlayerInCell(cell.row, cell.col));
	unit.position.copy(point);
	unit.position.y = unit.cameraHeight;
	var direction = (point.z > 0 ? 0 : -1) * Math.PI;
	unit.rotation.set(0, direction, 0);
}

function respawn() {
	player.health = player.maxHealth;
	player.respawning = true;
	document.getElementById('crosshairs').className = 'hidden';
	document.getElementById('respawn').className = 'center';
	var countdown = document.querySelectorAll('#respawn .countdown')[0];
	setTimeout(function() {
		countdown.textContent = '2';
		setTimeout(function() {
			countdown.textContent = '1';
			setTimeout(function() {
				countdown.textContent = '3';
				document.getElementById('health').textContent = player.health;
				document.getElementById('health').className = '';
				document.getElementById('crosshairs').className = '';
				document.getElementById('respawn').className = 'center hidden';
				player.respawning = false;
				spawn();
			}, 1000);
		}, 1000);
	}, 1000);
}

var isPlayerInCell = (function() {
	var cell = new MapCell();
	return function(row, col) {
		mapCellFromPosition(player.position, cell);
		if (cell.row == row && cell.col == col) return true;
		for (var i = 0, l = enemies.length; i < l; i++) {
			mapCellFromPosition(enemies[i].position, cell);
			if (cell.row == row && cell.col == col) return true;
		}
		return false;
	};
})();

function move(bot) {
	bot.rotation.y = Math.random() * Math.PI * 2;
	var leftBias = bot.moveDirection.LEFT ? -0.1 : 0.1;
	var forwardBias = bot.moveDirection.FORWARD ? -0.1 : 0.1;
	bot.moveDirection.LEFT = Math.random() + leftBias < 0.1;
	bot.moveDirection.RIGHT = !bot.moveDirection.LEFT && Math.random() + leftBias < 0.1;
	bot.moveDirection.FORWARD = Math.random() + forwardBias < 0.8;
	bot.moveDirection.BACKWARD = !bot.moveDirection.FORWARD && Math.random() < 0.05;
	if (Math.random() < 0.4) bot.jump();
}

// COLLISION =================================================================

var checkPlayerCollision = (function() {
	var cell = new MapCell();
	return function(player) {
		player.collideFloor(floor.position.y);
		mapCellFromPosition(player.position, cell);
		switch (cell.char) {
			case ' ':
			case 'S':
			case 'R':
			case 'B':
				if (Math.floor(player.position.y - player.cameraHeight) <= floor.position.y) {
					player.canJump = true;
				}
				break;
			case 'T':
				var topPosition = cell.mesh.position.y + VERTICAL_UNIT * 0.5;
				if (player.collideFloor(topPosition)) {
					player.canJump = true;
				}
				else if (player.position.y - player.cameraHeight * 0.5 < topPosition) {
					moveOutside(cell.mesh.position, player.position);
				}
				break;
			case 'X':
				moveOutside(cell.mesh.position, player.position);
				break;
		}
	};
})();

var checkBulletCollision = (function() {
	var cell = new MapCell();
	function removeBullet(bullet, i) {
		scene.remove(bullet);
		deadBulletPool.push(bullet);
		bullets.splice(i, 1);
	}
	return function(bullet, i) {
		if (bullet.team !== player.team && spheresOverlap(bullet, player)) {
			hurt(bullet);
			removeBullet(bullet, i);
		}
		for (var j = 0; j < numEnemies; j++) {
			var enemy = enemies[j];
			if (bullet.team !== enemy.team && spheresOverlap(bullet, enemy)) {
				enemy.health -= bullet.damage;
				removeBullet(bullet, i);
				// Darken enemy as it gets damaged
				var color = enemy.material.color,
						percent = ((enemy.health / enemy.maxHealth) + 0.3) / 1.3;
				enemy.material.color.setRGB(
					percent * color.r,
					percent * color.g,
					percent * color.b
				);
				break;
			}
		}
		mapCellFromPosition(bullet.position, cell);
		if (cell.char == 'X' ||
				(cell.char == 'T' && bullet.position.y - Bullet.RADIUS < cell.mesh.position.y + VERTICAL_UNIT * 0.5) ||
				bullet.position.y - Bullet.RADIUS < floor.position.y ||
				bullet.position.y > VERTICAL_UNIT * 5) {
			removeBullet(bullet, i);
		}
	};
})();

function mapCellFromPosition(position, cell) {
	cell = cell || new MapCell();
	var XOFFSET = (map.length+1) * 0.5 * HORIZONTAL_UNIT,
			ZOFFSET = (map[0].length+1) * 0.5 * HORIZONTAL_UNIT;
	var mapCol = Math.floor((position.x + XOFFSET) / HORIZONTAL_UNIT) - 1,
			mapRow = Math.floor((position.z + ZOFFSET) / HORIZONTAL_UNIT) - 1,
			char = mapRow < map.length ? map[mapRow].charAt(mapCol) : -1,
			mesh = mapRow < map[0].length ? meshMap[mapRow][mapCol] : -1;
	return cell.set(mapRow, mapCol, char, mesh);
}

function moveOutside(meshPosition, playerPosition) {
	var mw = HORIZONTAL_UNIT, md = HORIZONTAL_UNIT,
			mx = meshPosition.x - mw * 0.5, mz = meshPosition.z - md * 0.5;
	var px = playerPosition.x, pz = playerPosition.z;
	if (px > mx && px < mx + mw && pz > mz && pz < mz + md) {
		var xOverlap = px - mx < mw * 0.5 ? px - mx : px - mx - mw,
				zOverlap = pz - mz < md * 0.5 ? pz - mz : pz - mz - md;
		if (Math.abs(xOverlap) > Math.abs(zOverlap)) playerPosition.x -= xOverlap;
		else playerPosition.z -= zOverlap;
	}
}

// SHOOTING ===================================================================

var shoot = (function() {
	var negativeZ = new THREE.Vector3(0, 0, -1);
	var error = new THREE.Vector3();
	function produceError(deg) {
		if (typeof deg === 'undefined') deg = BOT_MAX_AXIAL_ERROR;
		return Math.random() * (deg / 90) - (deg / 180);
	}
	return function(from, to) {
		from = from || player;
		bullet = deadBulletPool.length ? deadBulletPool.pop() : new Bullet();
		bullet.position.copy(from.position);
		bullet.rotation.copy(from.rotation);
		if (to) {
			bullet.direction = to.position.clone().sub(from.position).normalize();
		}
		else {
			bullet.direction = negativeZ.clone().applyQuaternion(from.quaternion);
		}
		error.set(produceError(), produceError(), produceError());
		bullet.direction.add(error);
		bullet.team = from.team;
		bullets.push(bullet);
		scene.add(bullet);
	};
})();

function spheresOverlap(obj1, obj2) {
	var combinedRadius = obj1.constructor.RADIUS + obj2.constructor.RADIUS;
	return combinedRadius * combinedRadius >= obj1.position.distanceToSquared(obj2.position);
}

function hurt(bullet) {
	if (player.respawning) return;
	player.health -= bullet.damage;
	document.getElementById('health').textContent = Math.max(0, player.health);
	if (player.health < player.maxHealth * 0.25) {
		document.getElementById('health').className = 'low';
	}
	document.getElementById('hurt').className = '';
	if (player._hurtTimeout) clearTimeout(player._hurtTimeout);
	player._hurtTimeout = setTimeout(function() {
		document.getElementById('hurt').className = 'hidden';
	}, 150);
}

// This is not very efficient for large numbers of bots
// but it will do for small numbers
function closestEnemy(bot) {
	var minDistSq = Infinity, distSq = Infinity, target = null;
	for (var i = 0; i < numEnemies; i++) {
		if (bot.team !== enemies[i].team) {
			distSq = bot.position.distanceToSquared(enemies[i].position);
			if (distSq < minDistSq) {
				minDistSq = distSq;
				target = enemies[i];
			}
		}
	}
	if (bot.team !== player.team) {
		distSq = bot.position.distanceToSquared(player.position);
		if (distSq < minDistSq) {
			target = player;
		}
	}
	return target;
}

// TEAMS ======================================================================

function Team(name, color, flag) {
	this.name = name;
	this.color = color || 0xee1100;
	this.flag = flag || null;
}

var TEAMS = {
	R: new Team('Red', 0xee1100),
	B: new Team('Blue', 0x0066ee)
};

function checkHasFlag(unit) {
	var otherFlag = unit.team === TEAMS.R ? TEAMS.B.flag : TEAMS.R.flag;
	if (unit.hasFlag) {
		var flag = unit.team === TEAMS.R ? TEAMS.R.flag : TEAMS.B.flag;
		if (flag.mesh.visible && isPlayerInCell(flag.row, flag.col)) {
			otherFlag.mesh.traverse(function(node) {
				node.visible = true;
			});
			unit.hasFlag = false;
			console.log(unit.team === TEAMS.R ? TEAMS.R.name : TEAMS.B.name + ' team scored!');
			unit.team.fireworks.visible = true;
			unit.team.fireworks.scale.set(0.5, 0.5, 0.5);
			setTimeout(function() {
				unit.team.fireworks.visible = false;
			}, 3000);
			var cheering = unit.team === TEAMS.R ? TEAMS.R.cheering : TEAMS.B.cheering;
			THREE.AudioObject.call(cheering, 'sounds/cheering.ogg', 1, 1, false);
		}
	}
	else if (otherFlag.mesh.visible && isPlayerInCell(otherFlag.row, otherFlag.col)) {
		otherFlag.mesh.traverse(function(node) {
			node.visible = false;
		});
		unit.hasFlag = true;
		console.log('The ' + unit.team === TEAMS.R ? TEAMS.B.name : TEAMS.R.name + ' flag has been stolen!');
	}
	return unit.hasFlag;
}

// INPUT ======================================================================

document.addEventListener('mousemove', function(event) {
	if (!paused) {
		player.rotate(event.movementY, event.movementX, 0);
	}
}, false);

document.addEventListener('keydown', function(event) {
	// Allow CTRL+L, CTRL+T, CTRL+W, and F5 for sanity
	if (!event.ctrlKey || !(event.keyCode == 76 || event.keyCode == 84 || event.keyCode == 87)) {
		if (event.keyCode != 116) {
			event.preventDefault();
		}
	}
	switch (event.keyCode) {
		case 38: // up
		case 87: // w
			player.moveDirection.FORWARD = true;
			break;
		case 37: // left
		case 65: // a
			player.moveDirection.LEFT = true;
			break;
		case 40: // down
		case 83: // s
			player.moveDirection.BACKWARD = true;
			break;
		case 39: // right
		case 68: // d
			player.moveDirection.RIGHT = true;
			break;
		case 32: // space
			player.jump();
			break;
	}
}, false);

document.addEventListener('keyup', function(event) {
	switch (event.keyCode) {
		case 38: // up
		case 87: // w
			player.moveDirection.FORWARD = false;
			break;
		case 37: // left
		case 65: // a
			player.moveDirection.LEFT = false;
			break;
		case 40: // down
		case 83: // s
			player.moveDirection.BACKWARD = false;
			break;
		case 39: // right
		case 68: // d
			player.moveDirection.RIGHT = false;
			break;
		case 32: // space
			break;
	}
}, false);

document.addEventListener('click', function(event) {
	if (!paused) {
		event.preventDefault();
		shoot();
	}
});

// RUN ========================================================================

document.getElementById('start').addEventListener('click', function() {
	if (BigScreen.enabled) {
		var instructions = this,
				hud = document.getElementById('hud');
		BigScreen.request(document.body /*renderer.domElement*/, function() {
			PL.requestPointerLock(document.body /*renderer.domElement*/, function() {
				instructions.className = 'hidden';
				hud.className = 'playing';
				startAnimating();
			}, function() {
				// We can lose pointer lock but keep full screen when alt-tabbing away
				stopAnimating();
			}, function() {
				alert('Error: entering pointer lock failed');
			});
		}, function() {
			instructions.className = 'exited';
			hud.className = 'hidden';
			stopAnimating();
		}, function() {
			alert('Error: entering full screen failed');
		});
	}
	else {
		// We could fall back to alternative controls,
		// but for simplicity's sake, just complain.
		alert('Error: full screen not supported');
	}
});

setup();
