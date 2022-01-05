


function TurretSystem(game, px, py, size) {
	Entity.call(this, game);
	this.turrets = [];

	this.image = game.images.turret;
	this.width = 16;
	this.height = 16;

	this.frame = 0;
	this.max_frame = 1;

	this.create_canvas(game);
}
TurretSystem.prototype = Object.create(Entity.prototype);
TurretSystem.prototype.class_name = 'TurretSystem';
TurretSystem.prototype.update = function(game) {
	for (const t of this.turrets) {
		t.firetimer -= game.deltatime;
		if (t.firetimer <= 0) {
			t.firetimer += 1;
			this.fire_turret(game, t);
		}
	}

	if (game.mouse1_state && game.player_resource > 0) {
		var px = 16 * Math.floor(game.mouse_position.px / 16 + .5);
		var py = 16 * Math.floor(game.mouse_position.py / 16 + .5);

		if (!this.turrets.some(t => t.px == px && t.py == py)) {
			game.player_resource--;
			this.add_turret(game, px, py);
		}
	}
};
TurretSystem.prototype.add_turret = function(game, px, py) {
	this.turrets.push({
		px: px,
		py: py,
		firetimer: 0,
	});
	
	var buffer_context = this.buffer_canvas.getContext('2d');
	buffer_context.drawImage(this.image, px - this.width / 2, py - this.height / 2);
};
TurretSystem.prototype.fire_turret = function(game, turret) {
	game.game_systems.projectile_system.spawn_projectile(game, turret.px + 4, turret.py - 4);
	// game.add_entity(new TurretProjectile(game, turret.px + 4, turret.py - 4));
};
TurretSystem.prototype.remove_turrets = function(turrets) {
	var buffer_context = this.buffer_canvas.getContext('2d');
	for (const t of turrets) {
		buffer_context.clearRect(t.px - this.width / 2, t.py - this.height / 2, this.width, this.height);
	}

	this.turrets = this.turrets.filter(t => !turrets.includes(t));
};
TurretSystem.prototype.create_canvas = function(game) {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = game.canvas.width;
	this.buffer_canvas.height = game.canvas.height;
};
TurretSystem.prototype.redraw_canvas = function(game, dx, dy) {
	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	new_buffer_context.drawImage(this.buffer_canvas, dx, dy);
	this.buffer_canvas = new_buffer_canvas;
};
TurretSystem.prototype.draw = function(ctx) {
	ctx.drawImage(this.buffer_canvas, 0, 0);
};


function TurretProjectileSystem(game, px, py, size) {
	Entity.call(this, game);
	this.projectiles = [];

	this.image = game.images.projectile;
	this.width = 4;
	this.height = 4;

	this.create_canvas(game);
}
TurretProjectileSystem.prototype = Object.create(Entity.prototype);
TurretProjectileSystem.prototype.class_name = 'TurretProjectileSystem';
TurretProjectileSystem.prototype.update = function(game) {
	for (const p of this.projectiles) {
		p.px += p.vx * game.deltatime;
	}

	this.projectiles = this.projectiles.filter(p => p.px < 960);

	// console.log("this.projectiles:", this.projectiles.length);

	this.redraw_canvas(game, 64 * game.deltatime, 0);
};
TurretProjectileSystem.prototype.spawn_projectile = function(game, px, py) {
	this.projectiles.push({ px: px, py: py, a: 45 * Math.floor(Math.random() * 8), r: 90, vx: 64, vy: 0, });

	var buffer_context = this.buffer_canvas.getContext('2d');
	buffer_context.drawImage(this.image, px - this.width / 2, py - this.height / 2);
};
TurretProjectileSystem.prototype.remove_projectiles = function(projectiles) {
	var buffer_context = this.buffer_canvas.getContext('2d');
	for (const p of projectiles) {
		buffer_context.clearRect(p.px - this.width / 2 - 1, p.py - this.height / 2, this.width + 2, this.height);
	}

	this.projectiles = this.projectiles.filter(p => !projectiles.includes(p));
};
TurretProjectileSystem.prototype.create_canvas = function(game) {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = game.canvas.width;
	this.buffer_canvas.height = game.canvas.height;
	
	this.true_offset_x = 0;
	this.true_offset_y = 0;
};
TurretProjectileSystem.prototype.redraw_canvas = function(game, dx, dy) {
	this.true_offset_x += dx;
	this.true_offset_y += dy;

	var dx2 = this.true_offset_x - this.true_offset_x % 1;
	this.true_offset_x = this.true_offset_x % 1;
	var dy2 = this.true_offset_y - this.true_offset_y % 1;
	this.true_offset_y = this.true_offset_y % 1;

	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	new_buffer_context.drawImage(this.buffer_canvas, dx2, dy2);
	this.buffer_canvas = new_buffer_canvas;
};
TurretProjectileSystem.prototype.draw = function(ctx) {
	ctx.drawImage(this.buffer_canvas, 0, 0);
};


function EnemySystem(game, px, py, size) {
	Entity.call(this, game);
	this.enemies = [];

	this.image = game.images.enemy;
	this.alt_image = game.images.enemy2;
	this.width = 16;
	this.height = 16;

	this.enemy_rate = 1;

	this.create_canvas(game);
}
EnemySystem.prototype = Object.create(Entity.prototype);
EnemySystem.prototype.class_name = 'EnemySystem';
EnemySystem.prototype.update = function(game) {
	// console.log("this.enemies:", this.enemies.length);

	// update timers and positions
	for (const e of this.enemies) {
		e.timer -= game.deltatime;
		e.px += e.vx * game.deltatime;
	}
	// clean out enemies who are off screen
	this.enemies = this.enemies.filter(e => e.px > -this.width / 2);

	this.update_enemy_animations(game);
	this.check_projectile_collisions(game);
	this.check_turret_collisions(game);


	this.redraw_canvas(game, -12 * game.deltatime, 0);

	if (Math.random() < game.deltatime * this.enemy_rate)
		this.spawn_enemy(game, 960 - this.width, Math.floor(Math.random() * 720 / 16) * 16);

	this.enemy_rate = Math.min(this.enemy_rate + game.deltatime / 100, 60);
};
EnemySystem.prototype.spawn_enemy = function(game, px, py) {
	this.enemies.push({ px: px, py: py, a: 45 * Math.floor(Math.random() * 8), r: 90, vx: -12, vy: 0, timer: 1, health: 10, alt: false });

	var buffer_context = this.buffer_canvas.getContext('2d');
	buffer_context.drawImage(this.image, px - this.width / 2, py - this.height / 2, this.width, this.height);
};
EnemySystem.prototype.update_enemy_animations = function(game) {
	// update enemy animations
	var buffer_context = this.buffer_canvas.getContext('2d');
	for (const e of this.enemies.filter(e => e.timer <= 0)) {
		e.alt = !e.alt;
		e.timer += 1;
		buffer_context.clearRect(e.px - this.width / 2 - 1, e.py - this.height / 2, this.width + 2, this.height);
		if (Math.random() > 0.9) {
			e.py += Math.random() > 0.5 ? 16 : -16;
		}
		buffer_context.drawImage(e.alt ? this.alt_image : this.image, e.px - this.width / 2, e.py - this.height / 2, this.width, this.height);
	}
};
EnemySystem.prototype.check_projectile_collisions = function(game) {
	// hash table our projectiles
	var board = {};
	for (const p of game.game_systems.projectile_system.projectiles) {
		board[p.py+4] ??= [];
		board[p.py+4].push(p);
	}
	// calculate collisions of enemies and projectiles
	var hit_projectiles = [];
	var hit_enemies = [];
	for (const e of this.enemies) {
		var p = board[e.py]?.find(p => Math.abs(p.px - e.px) < 8);
		if (p) {
			hit_projectiles.push(p);
			hit_enemies.push(e);
		}
	}
	// remove the collided projectiles
	game.game_systems.projectile_system.remove_projectiles(hit_projectiles);

	// calculate damage to enemies
	for (const e of hit_enemies) { e.health--; }
	// calculate kills
	var killed = hit_enemies.filter(e => e.health <= 1);
	// remove killed enemies from buffer
	var buffer_context = this.buffer_canvas.getContext('2d');
	for (const e of killed) {
		buffer_context.clearRect(e.px - this.width / 2 - 1, e.py - this.height / 2, this.width + 2, this.height);
		game.player_resource++;
	}
	// remove killed enemies from enemies list
	this.enemies = this.enemies.filter(e => !killed.includes(e));
};
EnemySystem.prototype.check_turret_collisions = function(game) {
	// hash table our enemies
	var board = {};
	for (const p of this.enemies) {
		board[p.py] ??= [];
		board[p.py].push(p);
	}
	// calculate collisions of enemies and turrets
	var hit_turrets = game.game_systems.turret_system.turrets.filter(t => board[t.py]?.find(e => Math.abs(e.px - t.px) < 4));
	
	// remove the collided projectiles
	game.game_systems.turret_system.remove_turrets(hit_turrets);
};
EnemySystem.prototype.create_canvas = function(game) {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = game.canvas.width;
	this.buffer_canvas.height = game.canvas.height;

	this.true_offset_x = 0;
	this.true_offset_y = 0;
};
EnemySystem.prototype.redraw_canvas = function(game, dx, dy) {
	this.true_offset_x += dx;
	this.true_offset_y += dy;

	var dx2 = this.true_offset_x - this.true_offset_x % 1;
	this.true_offset_x = this.true_offset_x % 1;
	var dy2 = this.true_offset_y - this.true_offset_y % 1;
	this.true_offset_y = this.true_offset_y % 1;

	var new_buffer_canvas = document.createElement('canvas');
	new_buffer_canvas.width = game.canvas.width;
	new_buffer_canvas.height = game.canvas.height;
	var new_buffer_context = new_buffer_canvas.getContext('2d');
	new_buffer_context.drawImage(this.buffer_canvas, dx2, dy2);
	this.buffer_canvas = new_buffer_canvas;
};
EnemySystem.prototype.draw = function(ctx) {
	ctx.drawImage(this.buffer_canvas, 0, 0);
};



// function Turret(game, px, py, size) {
// 	ScreenEntity.call(this, game, px, py, size, size, game.images.turret);
// 	this.every(1, () => {
// 		game.add_entity(new TurretProjectile(game, this.px + 4, this.py - 4));
// 	});
// }
// Turret.prototype = Object.create(ScreenEntity.prototype);
// Turret.prototype.class_name = 'Turret';



// function TurretProjectile(game, px, py) {
// 	ScreenEntity.call(this, game, px, py, 4, 4, game.images.projectile);
// 	this.rotation = 90;
// 	this.angle = 45 * Math.floor(Math.random() * 8);

// 	this.vx = 64;

// 	this.after(6, () => {
// 		game.remove_entity(this);
// 	});
// }
// TurretProjectile.prototype = Object.create(ScreenEntity.prototype);
// TurretProjectile.prototype.class_name = 'TurretProjectile';





function main () {
	var canvas = document.querySelector('#game_canvas');
	var ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;

	nlo.load.load_all_assets({
		images: {
			ufo: 'assets/img/ufo.png',
			projectile: 'assets/img/projectile.png',
			turret: 'assets/img/turret.png',
			enemy: 'assets/img/enemy.png',
			enemy2: 'assets/img/enemy2.png',
		},
	}, loaded_assets => {
		var game = new GameSystem(canvas, loaded_assets);
		game.background_color = '#ccc';

		// start the player with three turrets
		game.player_resource = 3;

		// initialize all systems
		game.game_systems.turret_system = new TurretSystem(game);
		game.game_systems.projectile_system = new TurretProjectileSystem(game);
		game.game_systems.enemy_system = new EnemySystem(game);

		// game.game_systems.turret_system.add_turret(game, 32,32);
		// game.game_systems.enemy_system.spawn_enemy(game, 640,64);

		// game.add_entity(new Turret(game, 32, 32, 16));
		// game.entities.push(new TurretProjectile(game, 32, 32, 8));
		// game.entities.push(new XFlyingSpore(game, 0, 0, 32, [
		// 	{ px: 280, py: 140, speed: 2, },
		// 	{ timeout: 0, call_system: [ {system: 'creep_system', method: 'spill_creep', args: [[Math.floor(280/16), Math.floor(140/16)], 3.5] } ] },
		// 	{ timeout: 0, call_system: [ {system: 'building_system', method: 'build_building',
		// 		args: [XSporePool, [Math.floor(280/16) - 1, Math.floor(140/16) - 1]] } ] },
		// ]));

		// game.particle_systems.purple_particles = new ParticleEffectSystem(game, { fill_style: '#404', });

		// game.run_game(1000 / 60, ctx);

		game.run_game(ctx, 60);
		// setInterval(game.step_game_frame.bind(game, 1 / 60, ctx), 1000 / 60);
	});
}

window.addEventListener('load', main);
