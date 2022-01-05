


nlo = {
	load: {

		load_image: function(url, callback) {
			var image = new Image();
			image.addEventListener('load', callback.bind(undefined, image));
			image.addEventListener('error', function (e) {
				console.log("error loading image:", image, e);
			});
			// image.onload = callback.bind(undefined, image);
			image.src = url;
		},
		load_image_onpage: function(url, callback) {
			var img = document.querySelector("img[data-url='" + url + "']");
			if (img)
				callback(img);
			else
				nlo.load.load_image(url, callback);
		},
		load_audio: function(url, callback) {
			var audio = new Audio();
			// audio.addEventListener('canplaythrough', callback.bind(undefined, audio));
			var loaded = false;
			audio.addEventListener('canplaythrough', function () {
				if (!loaded) {
					loaded = true;
					callback(audio);
				}
			});
			audio.addEventListener('error', function (e) {
				console.log("error loading audio:", audio, e);
			});
			audio.preload = "auto";
			audio.src = url;
			audio.load();
			// audio.play();
		},

		load_all_images: function(images, callback) {
			var keys = Object.keys(images);
			var count_loaded = 0;
			for (var i = 0; i < keys.length; i++) {
				load_image(images[keys[i]], (function (key, image) {
					images[key] = image;

					count_loaded++;
					if (count_loaded === keys.length)
						callback();
				}).bind(undefined, keys[i]));
			}
		},

		image_to_dataurl: function(img) {
			var c = document.createElement("canvas");
			c.width = img.width;
			c.height = img.height;
			var ctx = c.getContext("2d");
			ctx.drawImage(img, 0, 0);
			return c.toDataURL("image/png");
		},

		load_all_assets: function(assets, callback) {
			var images = assets.images;
			var audio = assets.audio;

			var loaded_assets = {
				images: {},
				audio: {},
			};
			var count_loaded = 0;
			var count_expected = 0;
			if (images) {
				count_expected += Object.keys(images).length;
			}
			if (audio) {
				count_expected += Object.keys(audio).length;
			}

			if (images) {
				var keys = Object.keys(images);
				for (var i = 0; i < keys.length; i++) {
					nlo.load.load_image_onpage(images[keys[i]], (function (key, image) {
						// console.log("loaded image:", image);
						loaded_assets.images[key] = image;

						count_loaded++;
						if (count_loaded >= count_expected)
							callback(loaded_assets);
					}).bind(undefined, keys[i]));
				}
			}
			if (audio) {
				var keys = Object.keys(audio);
				for (var i = 0; i < keys.length; i++) {
					nlo.load.load_audio(audio[keys[i]], (function (key, audio_data) {
						// console.log("loaded audio:", audio_data);
						loaded_assets.audio[key] = audio_data;

						count_loaded++;
						if (count_loaded >= count_expected)
							callback(loaded_assets);
					}).bind(undefined, keys[i]));
				}
			}
		},
	},

	math: {
		point_offset: function(angle, dist) {
			return { px: dist * Math.cos(Math.PI * angle / 180), py: dist * Math.sin(Math.PI * angle / 180), };
		},

		point_dist: function(px, py) {
			return (px ** 2 + py ** 2) ** 0.5;
		},

		points_dist: function(p1, p2) {
			return ((p1.px - p2.px) ** 2 + (p1.py - p2.py) ** 2) ** 0.5;
		},

		point_normal: function(px, py) {
			var dist = (px ** 2 + py ** 2) ** 0.5;
			if (dist === 0)
				return { px: 0, py: 0 };
			return { px: px / dist, py: py / dist, };
		},

		d2_point_offset: function(angle, px, py) {
			return {
				px: px * Math.cos(Math.PI * angle / 180) - py * Math.sin(Math.PI * angle / 180),
				py: py * Math.cos(Math.PI * angle / 180) + px * Math.sin(Math.PI * angle / 180),
			};
		},

		point_angle: function(fromx, fromy, tox, toy) {
			var dx = tox - fromx;
			var dy = toy - fromy;
			var angle = Math.atan2(dy, dx);
			// console.log("angle: ", angle / Math.PI * 180);
			return angle / Math.PI * 180;
		},

		points_angle: function(from, to) {
			var angle = Math.atan2(to.py - from.py, to.px - from.px);
			// console.log("angle: ", angle / Math.PI * 180);
			return angle / Math.PI * 180;
		},

		point_rotate_90: function(p) {
			return { px: -p.py, py: p.px };
		},

		point_rotate_180: function(p) {
			return { px: -p.px, py: -p.py };
		},

		point_rotate_270: function(p) {
			return { px: p.py, py: -p.px };
		},


		angle_diff: function(a, b) {
			var diff = a - b;
			while (diff > 180) {
				diff -= 360;
			}
			while (diff < -180) {
				diff += 360;
			}

			return diff;
		},
	},
	image: {

		// renders a canvas with the given image textured by the texture
		image_render_textured: function (image, texture, offsetx, offsety, alpha) {
			var buffer_canvas = document.createElement('canvas');
			buffer_canvas.width = image.width;
			buffer_canvas.height = image.height;
			var buffer_context = buffer_canvas.getContext('2d');
			buffer_context.imageSmoothingEnabled = false;

			if (offsetx === 0 && offsety === 0) {
				buffer_context.drawImage(texture, 0, 0, image.width, image.height);
				
			} else {
				buffer_context.drawImage(texture, offsetx, offsety, image.width, image.height);
				buffer_context.drawImage(texture, offsetx - image.width, offsety, image.width, image.height);
				buffer_context.drawImage(texture, offsetx, offsety - image.height, image.width, image.height);
				buffer_context.drawImage(texture, offsetx - image.width, offsety - image.height, image.width, image.height);
			}

			buffer_context.globalCompositeOperation = "destination-in";
			buffer_context.drawImage(image, 0,0);
			buffer_context.globalCompositeOperation = "source-over";
			buffer_context.globalAlpha = alpha;
			buffer_context.drawImage(image, 0,0);
			return buffer_canvas;
		},

		// converts all pixel colors in the image to the given fill style
		image_colorize: function  (image, fill_style) {
			var buffer_canvas = document.createElement('canvas');
			buffer_canvas.width = image.width;
			buffer_canvas.height = image.height;
			var buffer_context = buffer_canvas.getContext('2d');
			buffer_context.imageSmoothingEnabled = false;

			buffer_context.fillStyle = fill_style;
			buffer_context.fillRect(0,0, buffer_canvas.width, buffer_canvas.height);

			buffer_context.globalCompositeOperation = "destination-atop";
			buffer_context.drawImage(image, 0, 0);

			return buffer_canvas;
		},

		// adds an outline to the image
		image_outline: function (image, outline_style) {
			var buffer_canvas = document.createElement('canvas');
			buffer_canvas.width = image.width + 2;
			buffer_canvas.height = image.height + 2;
			var buffer_context = buffer_canvas.getContext('2d');
			buffer_context.imageSmoothingEnabled = false;

			var colored_image = image_lib.image_colorize(image, outline_style);

			buffer_context.translate(1, 1);
			buffer_context.drawImage(colored_image, -1, 0, image.width, image.height);
			buffer_context.drawImage(colored_image, 0, -1, image.width, image.height);
			buffer_context.drawImage(colored_image, 1, 0, image.width, image.height);
			buffer_context.drawImage(colored_image, 0, 1, image.width, image.height);

			return buffer_canvas;
		},

		// draws the top_image atop the bottom_image
		image_composite: function (bottom_image, top_image) {
			var buffer_canvas = document.createElement('canvas');
			buffer_canvas.width = bottom_image.width;
			buffer_canvas.height = bottom_image.height;
			var buffer_context = buffer_canvas.getContext('2d');
			buffer_context.imageSmoothingEnabled = false;

			buffer_context.drawImage(bottom_image, 0, 0, bottom_image.width, bottom_image.height);
			buffer_context.drawImage(top_image, bottom_image.width / 2 - top_image.width / 2, bottom_image.height / 2 - top_image.height / 2,
					top_image.width, top_image.height);

			return buffer_canvas;
		},

		// chops the image
		image_chop: function (image, offsetx, offsety, width, height, full_width, full_height) {
			var buffer_canvas = document.createElement('canvas');
			buffer_canvas.width = width;
			buffer_canvas.height = height;
			var buffer_context = buffer_canvas.getContext('2d');
			buffer_context.imageSmoothingEnabled = false;

			buffer_context.translate(-offsetx, -offsety);
			buffer_context.drawImage(image, 0, 0, full_width, full_height);

			return buffer_canvas;
		},

		// masks the image
		image_mask: function (image, mask, mask_frame, mask_max_frame) {
			mask_frame = mask_frame || 0;
			mask_max_frame = mask_max_frame || 1;

			var buffer_canvas = document.createElement('canvas');
			buffer_canvas.width = image.width;
			buffer_canvas.height = image.height;
			var buffer_context = buffer_canvas.getContext('2d');
			buffer_context.imageSmoothingEnabled = false;

			buffer_context.drawImage(image, 0, 0, image.width, image.height);
			buffer_context.globalCompositeOperation = 'destination-in';
			buffer_context.drawImage(mask,
				mask_frame * (mask.width / mask_max_frame), 0, mask.width / mask_max_frame, mask.height,
				0, 0, image.width, image.height);

			return buffer_canvas;
		},


		// flip an image across the y-axis
		image_flip_horizontal: function (image) {
			var buffer_canvas = document.createElement('canvas');
			buffer_canvas.width = image.width;
			buffer_canvas.height = image.height;
			var buffer_context = buffer_canvas.getContext('2d');
			buffer_context.imageSmoothingEnabled = false;

			buffer_context.translate(image.width, 0);
			buffer_context.scale(-1, 1);
			buffer_context.drawImage(image, 0, 0);

			return buffer_canvas;
		},

		// flip an image across the x-axis
		image_flip_vertical: function (image) {
			var buffer_canvas = document.createElement('canvas');
			buffer_canvas.width = image.width;
			buffer_canvas.height = image.height;
			var buffer_context = buffer_canvas.getContext('2d');
			buffer_context.imageSmoothingEnabled = false;

			buffer_context.translate(image.width, 0);
			buffer_context.scale(1, -1);
			buffer_context.drawImage(image, 0, 0);

			return buffer_canvas;
		},
	},
};


function GameSystem(canvas, assets) {
	this.canvas = canvas;
	canvas.game_system = this;
	this.images = assets.images;
	this.audio = assets.audio;

	this.entities = [];
	// this.entities_to_add = [];
	// this.entities_to_remove = [];

	this.game_systems = {};
	this.particle_systems = {};

	this.background_color = '#000';

	this.debug_time = { game_update_time: 0, game_draw_time: 0, game_entity_draw_time: {}, };
	this.debug_time_timer = 0;

	this.previous_keystate = {};
	this.keystate = {
		W: false,
		A: false,
		S: false,
		D: false,
		shift: false,
		ctrl: false,
		alt: false,
		
		space: false,
		left: false,
		up: false,
		right: false,
		down: false,

		number_0: false,
		number_1: false,
		number_2: false,
		number_3: false,
		number_4: false,
		number_5: false,
		number_6: false,
		number_7: false,
		number_8: false,
		number_9: false,
	};
	this.previous_mouse1_state = false;
	this.mouse1_state = false;
	this.mouse_position = { px: 0, py: 0 };

	document.addEventListener('keydown', (function (e) {
		e = e || window.event;
		if (!this.keystate.ctrl)
			e.preventDefault();
		var charcode = String.fromCharCode(e.keyCode);
		if (e.keyCode === 37)
			this.keystate.left = true;
		else if (e.keyCode === 38)
			this.keystate.up = true;
		else if (e.keyCode === 39)
			this.keystate.right = true;
		else if (e.keyCode === 40)
			this.keystate.down = true;
		else if (charcode === ' ')
			this.keystate.space = true;
		else if (charcode === '0')
			this.keystate.number_0 = true;
		else if (charcode === '1')
			this.keystate.number_1 = true;
		else if (charcode === '2')
			this.keystate.number_2 = true;
		else if (charcode === '3')
			this.keystate.number_3 = true;
		else if (charcode === '4')
			this.keystate.number_4 = true;
		else if (charcode === '5')
			this.keystate.number_5 = true;
		else if (charcode === '6')
			this.keystate.number_6 = true;
		else if (charcode === '7')
			this.keystate.number_7 = true;
		else if (charcode === '8')
			this.keystate.number_8 = true;
		else if (charcode === '9')
			this.keystate.number_9 = true;
		else
			this.keystate[charcode] = true;
		this.keystate.shift = !!e.shiftKey;
		this.keystate.ctrl = !!e.ctrlKey;
		this.keystate.alt = !!e.altKey;
		// console.log('keydown: ', e.keyCode, charcode);
	}).bind(this));

	document.addEventListener('keyup', (function (e) {
		e = e || window.event;
		if (!this.keystate.ctrl)
			e.preventDefault();
		var charcode = String.fromCharCode(e.keyCode);
		if (e.keyCode === 37)
			this.keystate.left = false;
		else if (e.keyCode === 38)
			this.keystate.up = false;
		else if (e.keyCode === 39)
			this.keystate.right = false;
		else if (e.keyCode === 40)
			this.keystate.down = false;
		else if (charcode === ' ')
			this.keystate.space = false;
		else if (charcode === '0')
			this.keystate.number_0 = false;
		else if (charcode === '1')
			this.keystate.number_1 = false;
		else if (charcode === '2')
			this.keystate.number_2 = false;
		else if (charcode === '3')
			this.keystate.number_3 = false;
		else if (charcode === '4')
			this.keystate.number_4 = false;
		else if (charcode === '5')
			this.keystate.number_5 = false;
		else if (charcode === '6')
			this.keystate.number_6 = false;
		else if (charcode === '7')
			this.keystate.number_7 = false;
		else if (charcode === '8')
			this.keystate.number_8 = false;
		else if (charcode === '9')
			this.keystate.number_9 = false;
		else
			this.keystate[charcode] = false;
		this.keystate.shift = !!e.shiftKey;
		this.keystate.ctrl = !!e.ctrlKey;
		this.keystate.alt = !!e.altKey;
		// console.log('keyup: ', charcode);
	}).bind(this));

	var self = this;
	this.canvas.addEventListener('mousedown', function (e) {
		var x = e.x - this.getBoundingClientRect().left;
		var y = e.y - this.getBoundingClientRect().top;
		self.mouse_position = { px: x, py: y };
		self.mouse_game_position = self.camera ? self.camera.translate_coordinates_to_world(self.mouse_position) : self.mouse_position;
		self.mouse1_state = true;
		// console.log("mousedown: ", x, y);
	});
	this.canvas.addEventListener('mouseup', function (e) {
		var x = e.x - this.getBoundingClientRect().left;
		var y = e.y - this.getBoundingClientRect().top;
		self.mouse_position = { px: x, py: y };
		self.mouse_game_position = self.camera ? self.camera.translate_coordinates_to_world(self.mouse_position) : self.mouse_position;
		self.mouse1_state = false;
		// console.log("mouseup: ", x, y);
	});
	this.canvas.addEventListener('mousemove', function (e) {
		var x = e.x - this.getBoundingClientRect().left;
		var y = e.y - this.getBoundingClientRect().top;
		self.mouse_position = { px: x, py: y };
		self.mouse_game_position = self.camera ? self.camera.translate_coordinates_to_world(self.mouse_position) : self.mouse_position;
		// console.log("mousemove: ", x, y);
		// console.log("mousemove: " + self.mouse_game_position.px + ',' + self.mouse_game_position.py);
	});
}
GameSystem.prototype.run_game = function(ctx, fps) {
	this.last_timestamp = new Date().getTime();
	setInterval(this.step_game_frame.bind(this, ctx), 1000 / fps);
}
GameSystem.prototype.step_game_frame = function(ctx) {
	var time = new Date().getTime();
	this.deltatime = (time - this.last_timestamp) / 1000;
    this.last_timestamp = time;
	// console.log('step:', this.deltatime);

	// var start = new Date().getTime(); // DEBUG_TIME
	this.update();
	// this.debug_time.game_update_time += new Date().getTime() - start; // DEBUG_TIME
	
	// start = new Date().getTime(); // DEBUG_TIME
	this.draw(ctx);
	// this.debug_time.game_draw_time += new Date().getTime() - start; // DEBUG_TIME
};
GameSystem.prototype.update = function () {
	try {
		// // update all additions and removals to the entity list
		// for (var i = 0; i < this.entities_to_remove.length; i++) {
		// 	var index = this.entities.indexOf(this.entities_to_remove[i]);
		// 	if (index >= 0)
		// 		this.entities.splice(index, 1);
		// }
		// this.entities_to_remove = [];

		// for (var i = 0; i < this.entities_to_add.length; i++)
		// 	this.entities.push(this.entities_to_add[i]);
		// this.entities_to_add = [];

		// update all entities
		for (var ent of [...this.entities]) {
			this.context_container = ent;
			ent.update(this);
		}

		// update all game systems
		for (var key of Object.keys(this.game_systems)) {
			this.context_container = this.game_systems[key];
			this.game_systems[key].update(this);
		}


		// update particle systems
		for (var key of Object.keys(this.particle_systems)) {
			this.particle_systems[key].update(this);
		}

		// refresh key and mouse states
		this.previous_keystate = this.keystate;
		this.keystate = Object.assign({}, this.keystate);
		this.previous_mouse1_state = this.mouse1_state;

	} catch (e) {
		console.error('exception during update:', e.message);
		console.error('exception stack:', e.stack);
	}

	this.context_container = undefined;
};
GameSystem.prototype.draw = function (ctx) {
	ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

	ctx.fillStyle = this.background_color;
	ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	var entities_to_draw = [...this.entities];
	entities_to_draw.sort(function (a, b) { return a.z_index - b.z_index; });
	var game_systems_to_draw = Object.values(this.game_systems);
	game_systems_to_draw.sort(function (a, b) { return a.z_index - b.z_index; });
	var particle_systems_to_draw = Object.values(this.particle_systems);
	particle_systems_to_draw.sort(function (a, b) { return a.z_index - b.z_index; });

	ctx.save();

	for (var system of game_systems_to_draw) {
		if (system.z_index < 0) {
			// var start = new Date().getTime(); // DEBUG_TIME
			system.draw(ctx);
			// this.debug_time.game_entity_draw_time[system.class_name] = // DEBUG_TIME
				// (this.debug_time.game_entity_draw_time[system.class_name] || 0) + new Date().getTime() - start; // DEBUG_TIME
		}
	}

	for (var particle_system of particle_systems_to_draw) {
		if (particle_system.z_index < 0) {
			// var start = new Date().getTime(); // DEBUG_TIME
			particle_system.draw(ctx);
			// this.debug_time.game_entity_draw_time[particle_system.class_name] = // DEBUG_TIME
				// (this.debug_time.game_entity_draw_time[particle_system.class_name] || 0) + new Date().getTime() - start; // DEBUG_TIME
		}
	}

	ctx.save();
	// apply camera transformations if we have a camera
	if (this.camera) {
		ctx.translate(+this.camera.width / 2, +this.camera.height / 2);
		ctx.rotate(Math.PI * -this.camera.angle / 180);
		ctx.scale(this.camera.scalex, this.camera.scaley);
		ctx.translate(-this.camera.px, -this.camera.py);
	}

	for (var ent of entities_to_draw) {
		// var start = new Date().getTime(); // DEBUG_TIME
		ent.draw(ctx);
		// this.debug_time.game_entity_draw_time[ent.class_name] = // DEBUG_TIME
			// (this.debug_time.game_entity_draw_time[ent.class_name] || 0) + new Date().getTime() - start; // DEBUG_TIME
	}
	ctx.restore();

	for (var particle_system of particle_systems_to_draw) {
		if (particle_system.z_index >= 0) {
			// var start = new Date().getTime(); // DEBUG_TIME
			particle_system.draw(ctx);
			// this.debug_time.game_entity_draw_time[particle_system.class_name] = // DEBUG_TIME
				// (this.debug_time.game_entity_draw_time[particle_system.class_name] || 0) + new Date().getTime() - start; // DEBUG_TIME
		}
	}

	for (var system of game_systems_to_draw) {
		if (system.z_index >= 0) {
			// var start = new Date().getTime(); // DEBUG_TIME
			system.draw(ctx);
			// this.debug_time.game_entity_draw_time[system.class_name] = // DEBUG_TIME
				// (this.debug_time.game_entity_draw_time[system.class_name] || 0) + new Date().getTime() - start; // DEBUG_TIME
		}
	}

	ctx.restore();

	for (var ent of [...this.entities]) {
		ent.draw_ui(ctx);
	}
};

GameSystem.prototype.add_entity = function(ent) {
	ent.parent = this;
	this.entities.push(ent);
	// this.entities_to_add.push(ent);
};

GameSystem.prototype.remove_entity = function(ent) {
	var index = this.entities.indexOf(ent);
	if (index !== -1) {
	// if (this.entities.indexOf(ent) !== -1) {
		this.entities.splice(index, 1);
		// this.entities_to_remove.push(ent);
	} else if (this.context_container !== undefined) {
		this.context_container.remove_entity(ent);
	}
};

GameSystem.prototype.query_entities = function(type) {
	var found = [];
	for (var i = 0; i < this.entities.length; i++) {
		if (this.entities[i] instanceof type) {
			found.push(this.entities[i]);
		}
	}

	return found;
};

GameSystem.prototype.query_entities_by_tag = function(type, tag_type) {
	var found = [];
	for (var i = 0; i < this.entities.length; i++) {
		if (this.entities[i] instanceof type) {
			if (this.entities[i].get_tag(tag_type) !== undefined) {
				found.push(this.entities[i]);
			}
		}
	}

	return found;
};

GameSystem.prototype.find_near = function(me, type, dist) {
	var found = [];
	for (var i = 0; i < this.entities.length; i++) {
		var ent = this.entities[i];
		if (ent instanceof type) {
			if (Math.abs(ent.px - me.px) < dist && Math.abs(ent.py - me.py) < dist &&
				Math.pow(Math.pow(ent.px - me.px, 2) + Math.pow(ent.py - me.py, 2), 0.5) < dist) {
				found.push(ent);
			}
		}
	}

	return found;
};

GameSystem.prototype.find_colliding_rectangular = function(me, type) {
	var found = [];
	for (var i = 0; i < this.entities.length; i++) {
		var ent = this.entities[i];
		if (ent instanceof type) {
			if (Math.abs(ent.px - me.px) < (ent.width + me.width) / 2 && Math.abs(ent.py - me.py) < (ent.height + me.height) / 2) {
				found.push(ent);
			}
		}
	}

	return found;
};

GameSystem.prototype.find_colliding_rectangular_nested = function(me, group_type, type) {
	var found = [];
	for (var i = 0; i < this.entities.length; i++) {
		var ent = this.entities[i];
		if (ent instanceof group_type) {
			for (var k = 0; k < ent.sub_entities.length; k++) {
				var ent_sub = ent.sub_entities[k];
				if (ent_sub instanceof type) {
					var offset = d2_point_offset(ent.angle, ent_sub.px, ent_sub.py);

					var p = { px: ent.px + offset.px, py: ent.py + offset.py };
					if (Math.abs(p.px - me.px) < (p.width + me.width) / 2 && Math.abs(p.py - me.py) < (p.height + me.height) / 2) {
						found.push(ent_sub);
					}
				}
			}
		}
	}

	return found;
};

GameSystem.prototype.find_colliding_circular = function(me, type, dist) {
	var found = [];
	for (var i = 0; i < this.entities.length; i++) {
		var ent = this.entities[i];
		if (ent instanceof type) {
			var hit_radius = dist + ent.collision_radius;
			if (Math.abs(ent.px - me.px) < hit_radius && Math.abs(ent.py - me.py) < hit_radius &&
				Math.pow(Math.pow(ent.px - me.px, 2) + Math.pow(ent.py - me.py, 2), 0.5) < hit_radius) {
				found.push(ent);
			}
		}
	}

	return found;
};

GameSystem.prototype.find_colliding_circular_nested = function(me, group_type, type, dist) {
	var found = [];
	for (var i = 0; i < this.entities.length; i++) {
		var ent = this.entities[i];
		if (ent instanceof group_type) {
			for (var k = 0; k < ent.sub_entities.length; k++) {
				var ent_sub = ent.sub_entities[k];
				if (ent_sub instanceof type) {
					var offset = d2_point_offset(ent.angle, ent_sub.px, ent_sub.py);

					var hit_radius = dist + ent_sub.collision_radius;
					var p = { px: ent.px + offset.px, py: ent.py + offset.py };
					if (Math.abs(p.px - me.px) < hit_radius && Math.abs(p.py - me.py) < hit_radius &&
						Math.pow(Math.pow(p.px - me.px, 2) + Math.pow(p.py - me.py, 2), 0.5) < hit_radius) {
						found.push(ent_sub);
					}
				}
			}
		}
	}

	return found;
};
GameSystem.prototype.move_camera = function(px, py) {
	this.camera.px = px;
	this.camera.py = py;

	this.mouse_game_position = this.camera.translate_coordinates_to_world(this.mouse_position);
};
GameSystem.prototype.rescale_camera = function(scalex, scaley) {
	this.camera.scalex = scalex;
	this.camera.scaley = scaley;

	this.mouse_game_position = this.camera.translate_coordinates_to_world(this.mouse_position);
};
GameSystem.prototype.rotate_camera = function(angle) {
	this.camera.angle = angle;
	
	this.mouse_game_position = this.camera.translate_coordinates_to_world(this.mouse_position);
};

function GameCamera(width, height) {
	this.width = width;
	this.height = height;

	this.scalex = 1;
	this.scaley = 1;

	this.px = this.width / 2;
	this.py = this.height / 2;
	this.angle = 0;
}
GameCamera.prototype.translate_coordinates_to_world = function(pxy) {
	
	var offset = d2_point_offset(this.angle, pxy.px - this.width / 2, pxy.py - this.height / 2);
	return { px: this.px + offset.px / this.scalex, py: this.py + offset.py / this.scaley };
};



function Entity(game) {
	this.sub_entities = [];
	this.ui_entities = [];
	this.entity_tags = [];
	this.coroutine_callbacks = [];
	this.visible = true;
}
Entity.prototype.class_name = 'Entity';
Entity.prototype.z_index = 0;
Entity.prototype.update = function(game) {
	for (var i = this.sub_entities.length - 1; i >= 0; i--) {
		this.sub_entities[i].update(game);
	}
	for (var i = this.ui_entities.length - 1; i >= 0; i--) {
		this.ui_entities[i].update(game);
	}
	for (var i = this.entity_tags.length - 1; i >= 0; i--) {
		if (this.entity_tags[i].timer !== undefined) {
			this.entity_tags[i].timer--;
			if (this.entity_tags[i].timer <= 0) {
				this.entity_tags.splice(i, 1);
			}
		}
	}
	for (var i = this.coroutine_callbacks.length - 1; i >= 0; i--) {
		var coro = this.coroutine_callbacks[i];
		coro.timer -= game.deltatime;
		if (coro.timer <= 0) {
			if (coro.interval !== undefined) {
				coro.timer += coro.interval;
			} else {
				this.coroutine_callbacks.splice(i, 1);
			}
			coro.callback();
		}
	}
};
Entity.prototype.draw = function(ctx) {
	if (this.visible) {
		for (var i = 0; i < this.sub_entities.length; i++) {
			this.sub_entities[i].draw(ctx);
		}
	}
};
Entity.prototype.draw_ui = function(ctx) {
	if (this.visible) {
		for (var i = 0; i < this.ui_entities.length; i++) {
			this.ui_entities[i].draw(ctx);
		}
	}
};
Entity.prototype.every = function(delta, callback) {
	this.coroutine_callbacks.push({
		timer: delta,
		interval: delta,
		callback: callback,
	});
};
Entity.prototype.after = function(delta, callback) {
	this.coroutine_callbacks.push({
		timer: delta,
		callback: callback,
	});
};
Entity.prototype.get_tag = function(type) {
	for (var i = 0; i < this.entity_tags.length; i++) {
		if (this.entity_tags[i] instanceof type) {
			return this.entity_tags[i];
		}
	}
	return undefined;
};
Entity.prototype.add_tag = function(tag) {
	if (tag.exclusive) {
		// if tag requires exclusivity with itself, check for an existing tag of the same class
		var existing = this.get_tag(tag.constructor);
		if (existing) {
			if (tag.exclusive === 'reset') {
				existing.timer = tag.timer;
			} else if (tag.exclusive === 'stack') {
				existing.timer += tag.timer;
			}
			// else leave the existing tag in place
			return existing;
		} else {
			this.entity_tags.push(tag);
		}
	} else {
		this.entity_tags.push(tag);
	}
	return tag;
};
Entity.prototype.remove_tag = function(tag) {
	var index = this.entity_tags.indexOf(tag);
	if (index !== -1) {
		this.entity_tags.splice(index, 1);
	}
};
Entity.prototype.add_entity = function(ent) {
	ent.parent = this;
	this.sub_entities.push(ent);
};
Entity.prototype.remove_entity = function(ent) {
	var index = this.sub_entities.indexOf(ent);
	if (index !== -1) {
		this.sub_entities.splice(index, 1);
	}
};

function ScreenEntity(game, px, py, width, height, image) {
	Entity.call(this, game);
	this.px = px;
	this.py = py;
	this.vx = 0;
	this.vy = 0;
	this.angle = 0;
	this.frame = 0;
	this.max_frame = 1;
	this.width = width;
	this.height = height;
	this.image = image;

	this.rotation = 0;
	this.alpha = 1;
	this.angle_granularity = 15;
}
ScreenEntity.prototype = Object.create(Entity.prototype);
ScreenEntity.prototype.constructor = ScreenEntity;
ScreenEntity.prototype.class_name = 'ScreenEntity';
ScreenEntity.prototype.update = function(game) {
	Entity.prototype.update.call(this, game);
	if (this.rotation) {
		this.angle += this.rotation * game.deltatime;
		this.angle %= 360;
	}
	this.px += this.vx * game.deltatime;
	this.py += this.vy * game.deltatime;
};
ScreenEntity.prototype.draw = function(ctx) {
	// ctx.drawImage(this.image, this.px - this.width / 2, this.py - this.height / 2, this.width, this.height);
	if (this.visible) {
		ctx.save();

		ctx.globalAlpha = this.alpha;

		ctx.translate(this.px, this.py);
		ctx.rotate(Math.PI * (Math.floor(this.angle / this.angle_granularity) * this.angle_granularity) / 180);

		for (var i = 0; i < this.sub_entities.length; i++) {
			if (this.sub_entities[i].z_index < this.z_index)
				this.sub_entities[i].draw(ctx);
		}

		this.draw_self(ctx);

		for (var i = 0; i < this.sub_entities.length; i++) {
			if (this.sub_entities[i].z_index >= this.z_index)
				this.sub_entities[i].draw(ctx);
		}

		ctx.restore();
	}
};
ScreenEntity.prototype.draw_self = function(ctx) {
	if (this.image) {
		ctx.drawImage(this.image,
			this.frame * (this.image.width / this.max_frame), 0, this.image.width / this.max_frame, this.image.height,
			0 - this.width / 2, 0 - this.height / 2, this.width, this.height);
	}
};
ScreenEntity.prototype.draw_ui = function(ctx) {
	if (this.visible) {
		ctx.save();
		ctx.translate(this.px, this.py);
		for (var i = 0; i < this.ui_entities.length; i++) {
			this.ui_entities[i].draw(ctx);
		}
		ctx.restore();
	}
};

