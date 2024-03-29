const MeteorFall = (function () {

	// глобальные настройки
	let settings = {
		name: null,
		canvas: document.querySelector('.js_game'),
		ctx: document.querySelector('.js_game').getContext('2d'),
		buffer: null,
		bufferCtx: null,
		width: window.innerWidth,
		height: window.innerHeight,
		meteorsArr: [], // массив всех метеоров
		meteorsNum: 15, // начальное кол-во метеоров

		userPoints: 0, // очки набранные юзером
		diffLvl: 1, // начальный уровень сложности
		diffInterval: 10, //секунды
		increaseDiffLVLCounter: null, //счетчик увеличения слоности

		// Библиотека звуков
		soundsLib: {
			heal_1: {
				trackPath: './audio/heal_1.wav',
				trackVolume: 1
			},
			hit_1: {
				trackPath: './audio/hit_1.wav',
				trackVolume: 1
			},
			bg_1: {
				trackPath: './audio/bg_1.mp3',
				trackVolume: 0.5
			},
		},

		globalRender: null, // счетчик глобального рендера
	};

	// установка пукнтов настроек
	// let _setSettings = function (userSettings) {
	// 	settings.name = userSettings.name;
	// };

	// возвращает рандомное число от min до max включительно
	let _random = function getRandomInt(min, max) {
		return Math.round(Math.random() * (max - min)) + min;
	}

	// класс корабля
	class Ship {
		constructor(settings) {
			this.globalSettings = settings.globalSettings; //прокидываение в класс глобальных настроек
			this.size = settings.size;
			this.posX = null || this.globalSettings.width / 2;
			this.posY = null || this.globalSettings.height - 100;
			this.hitPoints = 100;

			this.flameX = null;
			this.flameY = null || this.posY + this.size - 8;
			this.flameSize = 7;
			this.flameSpeed = 7;
			this.flameTrack = 0;

			this.shieldShowTimer = null;
			this.shieldShowStatus = false;
			this.shieldColor = null;

			this.drow();
			this.fly();
		}
		// отрисовка корабля
		drow() {
			let _this = this;
			this.shipPic = new Image();
			this.shipPic.src = 'img/ship1.png';
			this.shipPic.addEventListener("load", function() {
				_this.globalSettings.bufferCtx.drawImage(_this.shipPic, (_this.globalSettings.width / 2) - (_this.size / 2), _this.globalSettings.height - 100, _this.size, _this.size);
			}, false);
		}
		// перемещение корабля
		fly() {
			let _this = this;
			const setShipPos = (e) => {
				_this.posX = Math.round(e.pageX - (_this.size / 2));
				_this.posY = Math.round(e.pageY - (_this.size / 2));
			}
			document.addEventListener("mousemove", setShipPos, false);
		}
		// огонь двигателя при полете
		flame() {
			let _this = this;
			settings.bufferCtx.fillStyle = 'orange';
			settings.bufferCtx.beginPath();
			settings.bufferCtx.arc(this.flameX, this.flameY, _this.flameSize, 0, 2*Math.PI);
			settings.bufferCtx.fill();
			_this.flameY += _this.flameSpeed;
			_this.flameTrack += _this.flameSpeed;
			_this.flameSize -= 0.7;
			if (_this.flameTrack > 50) {
				_this.flameX = _this.posX + (_this.size / 2);
				_this.flameY = _this.posY + _this.size - 8;
				_this.flameTrack = 0;
				_this.flameSize = 7;
			}
		}
		// отображение щита вокруг корбля
		shield() {
			let _this = this;
			let degreesStart = 160;
			let radiansStart = (Math.PI / 180) * degreesStart;
			let degreesEnd = 20;
			let radiansEnd = (Math.PI / 180) * degreesEnd;
			settings.bufferCtx.strokeStyle = this.shieldColor;
			settings.bufferCtx.lineWidth = 1.5;
			settings.bufferCtx.beginPath();
			settings.bufferCtx.arc(this.posX + (_this.size / 2), this.posY + (_this.size / 2), (_this.size + 10) / 2, radiansStart, radiansEnd);
			settings.bufferCtx.stroke();
		}
		// показывает щит на определенное время
		shieldShow(color) {
			let _this = this;
			this.shieldColor = color;
			this.shieldShowStatus = true;
			this.shieldShowTimer = setTimeout(() => {
				_this.shieldShowStatus = false;
			}, 150);
		}
		// TODO: поворот корабля при перемещении
		rotate() {
			let _this = this;
		}
		// обновление позиции корабля
		// перерисовывает корабль на стартовых координатах перемещения мыши, далее на курсоре
		update() {
			let _this = this;
			_this.flame();
			if (_this.shieldShowStatus) {
				_this.shield();
			}
			_this.globalSettings.bufferCtx.drawImage(_this.shipPic, _this.posX, _this.posY, _this.size, _this.size);
		} 
	}

	// класс метеорита
	class Meteor {
		constructor(settings) {
			this.globalSettings = settings.globalSettings; //прокидываение в класс глобальных настроек
			this.posX = Math.floor(Math.random() * this.globalSettings.width);
			this.posY = -Math.floor(Math.random() * this.globalSettings.height);
			this.size = settings.size;
			this.meteorPic = null;
			this.dropSpeed = settings.dropSpeed;
			this.lvl = null; // уровень метеорита

			this.setLVL();
			this.drow();
		}
		// отрисовка метеорита
		drow() {
			let _this = this;
			this.meteorPic = new Image();
			this.meteorPic.src = 'img/meteor3.png';
			this.meteorPic.addEventListener("load", function() {
				_this.globalSettings.bufferCtx.drawImage(_this.meteorPic, _this.posX, _this.posY, _this.size, _this.size);
			}, false);
		}
		// перемешение метеритов
		update() {
			let _this = this;
			this.posY += this.dropSpeed;
			if (this.posY > this.globalSettings.height) {
				this.posX = Math.floor(Math.random() * this.globalSettings.width);
				this.posY = -Math.floor(Math.random() * this.globalSettings.height);
				this.flyAway();
			}
			_this.globalSettings.bufferCtx.drawImage(_this.meteorPic, _this.posX, _this.posY, _this.size, _this.size);
		}
		// расчет уровня метеорита
		setLVL() {
			switch (true) {
				case (this.size >= 40 && this.size < 60):
					this.lvl = 1;
					break;
				case (this.size >= 60 && this.size < 80):
					this.lvl = 2;
					break;
				case (this.size >= 80 && this.size <= 100):
					this.lvl = 3;
					break;
				default:
					this.lvl = 1;
					break;
			}
		}
		// событие успешного пересечения метеоритом игрового поля
		flyAway() {
			model.calcUserPoints(this.lvl, this.dropSpeed);
		}
		// TODO: вращение метеорита
		rotate() {
			let _this = this;
		}
	}

	// класс фоновой картинки
	class Background {
		constructor(settings) {
			this.globalSettings = settings.globalSettings; //прокидываение в класс глобальных настроек
			this.pic = settings.pic;
			this.posX = 0;
			this.posY = 0;
			this.speed = settings.speed;

			this.drow();
		}
		// отрисовка фона
		drow() {
			let _this = this;
			this.bgPic1 = new Image();
			this.bgPic2 = new Image();
			this.bgPic1.src = `img/space2.png`;
			this.bgPic2.src = this.bgPic1.src;
			this.bgPic1.addEventListener("load", function() {
				_this.globalSettings.bufferCtx.drawImage(_this.bgPic1, _this.posX, _this.posY, _this.globalSettings.width, _this.globalSettings.height);
				_this.globalSettings.bufferCtx.drawImage(_this.bgPic2, _this.posX, _this.posY - _this.globalSettings.height, _this.globalSettings.width, _this.globalSettings.height);
			}, false);
		}
		// обновление позиции фона
		update() {
			let _this = this;
			this.posY += this.speed;
			if (this.posY > _this.globalSettings.height) {
				this.posY = 0;
			}
			_this.globalSettings.bufferCtx.drawImage(_this.bgPic1, _this.posX, _this.posY, _this.globalSettings.width, _this.globalSettings.height);
			_this.globalSettings.bufferCtx.drawImage(_this.bgPic2, _this.posX, _this.posY - _this.globalSettings.height, _this.globalSettings.width, _this.globalSettings.height);
		}
	}

	// TODO: класс летящих фоновых частичек
	class Particle {
		constructor(settings) {
			this.globalSettings = settings.globalSettings; //прокидываение в класс глобальных настроек

			this.drow();
		}
		drow() {
			let _this = this;
		}
		update() {
			let _this = this;
		}
	}

	// класс падающих аптечек
	class Heal {
		constructor(settings) {
			this.globalSettings = settings.globalSettings; //прокидываение в класс глобальных настроек
			this.posX = Math.floor(Math.random() * this.globalSettings.width);
			this.posY = -Math.floor(Math.random() * this.globalSettings.height);
			this.size = settings.size;
			this.healValue = 5;
			this.healPic = null;
			this.dropSpeed = settings.dropSpeed;

			this.drow();
		}
		drow() {
			let _this = this;
			this.healPic = new Image();
			this.healPic.src = 'img/medkit1.jpg';
			this.healPic.addEventListener("load", () => {
				_this.globalSettings.bufferCtx.drawImage(_this.healPic, _this.posX, _this.posY, _this.size, _this.size);
			}, false);
		}
		update() {
			let _this = this;
			this.posY += this.dropSpeed;
			if (this.posY > this.globalSettings.height) {
				this.posX = Math.floor(Math.random() * this.globalSettings.width);
				this.posY = -Math.floor(Math.random() * this.globalSettings.height * 10);
			}
			_this.globalSettings.bufferCtx.drawImage(_this.healPic, _this.posX, _this.posY, _this.size, _this.size);
		}
		heal() {
			let _this = this;
			if(model.playerShip.hitPoints < 100) {
				model.playerShip.hitPoints += _this.healValue;
				if (model.playerShip.hitPoints > 100) {
					model.playerShip.hitPoints = 100;
				}
				view.setUIHitPoint(model.playerShip.hitPoints);
			}
			else {
				model.playerShip.hitPoints = 100;
			}
		}
	}

	// класс звуковых эффектов
	class Sounds {
		constructor(settings) {
			this.globalSettings = settings.globalSettings; //прокидываение в класс глобальных настроек
		}
		playBg() {
			this.audioBg = new Audio();
			this.audioBg.preload = 'auto';
			this.audioBg.src = settings.soundsLib.bg_1.trackPath;
			this.audioBg.volume = settings.soundsLib.bg_1.trackVolume;
			this.audioBg.loop = true;
			this.audioBg.play();
		}
		stopBg() {
			this.audioBg.pause();
		}
		playHit() {
			this.audioHit = new Audio();
			this.audioHit.preload = 'auto';
			this.audioHit.src = settings.soundsLib.hit_1.trackPath;
			this.audioHit.volume = settings.soundsLib.hit_1.trackVolume;
			this.audioHit.play();
		}
		playHeal() {
			this.audioHeal = new Audio();
			this.audioHeal.preload = 'auto';
			this.audioHeal.src = settings.soundsLib.heal_1.trackPath;
			this.audioHeal.volume = settings.soundsLib.heal_1.trackVolume;
			this.audioHeal.play();
		}
	}

	// MODEL
	let model = {
		// Запуск цикла отрисовки
		startDrow: function() {
			view.drow();
		},
		// создание массива метеоритов
		spawnMeteors: function(num) {
			for(let i = 0; i <= num - 1; i++) {
				settings.meteorsArr[i] = new Meteor({
					globalSettings: settings,
					size: _random(40, 100),
					dropSpeed: _random(2, 7),
				})
			}
		},
		// инит корабля
		addShip: function() {
			this.playerShip = new Ship({
				globalSettings: settings,
				size: 80,
			});
		},
		// инит фона
		addBackground: function() {
			this.background = new Background({
				globalSettings: settings,
				pic: 'space2.png',
				speed: 0.5,
			});
		},
		// инит аптечек
		addHeal: function() {
			this.healKit = new Heal({
				globalSettings: settings,
				size: 30,
				dropSpeed: 7,
			});
		},
		// добавление нового метеорита в массив
		addMeteor: function() {
			settings.meteorsArr.push(new Meteor({
				globalSettings: settings,
				size: _random(40, 100),
				dropSpeed: _random(2, 7),
			}))
		},
		// инит звука
		addSounds: function() {
			this.sounds = new Sounds({});
		},
		//Обработка столкновений //TODO: страшное гэ и надо что-то делать
		collision: function() {

			let shipFront = model.playerShip.posY;
			let shipBack = model.playerShip.posY + model.playerShip.size;
			let shipLeft = model.playerShip.posX;
			let shipRight = model.playerShip.posX + model.playerShip.size;

			let healFront = model.healKit.posY;
			let healBack = model.healKit.posY + model.healKit.size;
			let healLeft = model.healKit.posX;
			let healRight = model.healKit.posX + model.healKit.size;

			for (var i = 0; i < settings.meteorsArr.length; i++) {
				
				let meteorFront = settings.meteorsArr[i].posY;
				let meteorBack = settings.meteorsArr[i].posY + settings.meteorsArr[i].size;
				let meteorLeft = settings.meteorsArr[i].posX;
				let meteorRight = settings.meteorsArr[i].posX + settings.meteorsArr[i].size;
				
				if (shipFront <= meteorBack && shipBack >= meteorFront && shipLeft <= meteorRight && shipRight >= meteorLeft) {
					settings.meteorsArr[i].posX = Math.floor(Math.random() * settings.width);
					settings.meteorsArr[i].posY = -Math.floor(Math.random() * settings.height);
					this.clash(settings.meteorsArr[i].lvl);
					model.playerShip.shieldShow('red');
					model.sounds.playHit();
				}
			}

			if (shipFront <= healBack && shipBack >= healFront && shipLeft <= healRight && shipRight >= healLeft) {
				model.healKit.posX = Math.floor(Math.random() * settings.width);
				model.healKit.posY = -Math.floor(Math.random() * settings.height * 10);
				model.healKit.heal();
				model.sounds.playHeal();
				model.playerShip.shieldShow('green');
			}
		},
		// Удар метеорита о корабль  //TODO: перенести в класс корабля
		clash: function(meteorLVL) {
			switch (meteorLVL) {
				case 1:
					model.playerShip.hitPoints -= 6;
					break;
				case 2:
					model.playerShip.hitPoints -= 8;
					break;
				case 3:
					model.playerShip.hitPoints -= 10;
					break;
				default:
					model.playerShip.hitPoints -= 6;
					break;
			}
			
			if (model.playerShip.hitPoints > 0) {
				view.setUIHitPoint(model.playerShip.hitPoints);
			}
			else {
				view.setUIHitPoint(0);
				this.stopGame();
			}
		},
		
		// Устанавливает имя игрока
		showUIUserName: function() {
			view.showUIUserName(settings.name);
		},
		// КОНЕЦ ИГРЫ - остановка рендера игры, заполнение базы, отображение результатов
		stopGame: function() {
			cancelAnimationFrame(settings.globalRender);
			clearInterval(settings.increaseDiffLVLCounter);
			model.sounds.stopBg();
			firebaseStorage.addPlayer(settings.name, settings.userPoints);
			view.setUserResult();
			view.resultModal('show');
		},
		// увеличение уровня сложности
		increaseDiffLVL: function() {
			settings.increaseDiffLVLCounter = setInterval(() => {
				settings.diffLvl += 1;
				model.addMeteor();
				view.setUIDiffLVL();
			}, settings.diffInterval * 1000)
		},
		// подсчет очков
		calcUserPoints: function(meteorLVL, meteorSpeed) {
			settings.userPoints += 1 + ((meteorLVL * meteorSpeed / 10) * (settings.diffLvl / 3));
			view.setUIPoints();
		},
		// показывает панель игрока
		showUIPanel: function() {
			view.showUIPanel();
		},
		// показывает прогресс до начала игры
		showStartProgress: function() {
			view.showStartProgress();
		},
		// расчет заполнения шкалы прогресса
		runStartProgress: function(bar) {
			let width = 0;
			let time = 5000;
			let step = 10;
			let loop = setInterval(frame, time / step);
			function frame() {
				if (width >= 100) {
					clearInterval(loop);
					controller.uiElement.modalGameStart.modal('hide');
					model.startDrow();
					model.increaseDiffLVL();
					model.sounds.playBg();
				}
				else {
					width += step;
					bar.style.width = width + '%';
				}
			}
		},
		// показывает таблицу результатов
		showResultTable: function() {
			const getPlyersPromise = new Promise((resolve, reject) => {
				const players = firebaseStorage.getPlayers();
				if (players) {
					resolve(players);
				}
				else {
					reject(new Error('Не удалось получить список игроков'));
				}
			});

			getPlyersPromise.then(
				response => {
					view.showResultTable(response);
				}, 
				error => {
					console.log(error.message)
				});

		},
		// перезапуск игры
		restartGame: function() {
			settings.userPoints = 0;
			settings.diffLvl = 1;
			settings.meteorsArr = [];

			view.setUIPoints();
			view.setUIDiffLVL();
			view.setUIHitPoint(100);
			view.resultModal('hide');

			setTimeout(() => {
				model.startDrow();
				model.increaseDiffLVL();
				model.sounds.playBg();
			}, 1000);
		},
	}

	// VIEW
	let view = {
		// очистка области
		clear: function() {
			settings.bufferCtx.clearRect(0, 0, settings.width, settings.height);
		},
		// отрисовка
		drow: function() {
			let _this = this;

			settings.buffer = document.createElement("canvas"),
			settings.bufferCtx = settings.buffer.getContext("2d"),
			settings.buffer.width = settings.width;
			settings.buffer.height = settings.height;

			settings.canvas.width = settings.width;
			settings.canvas.height = settings.height;

			model.addBackground();
			model.addShip();
			model.addHeal();
			model.spawnMeteors(settings.meteorsNum); //!

			// цикл отрисовки
			function loop() {
				settings.globalRender = requestAnimationFrame(loop);
				view.clear();
				model.background.update();
				model.playerShip.update();
				model.healKit.update();
				settings.meteorsArr.forEach((item, i) => {
					item.update();
				});
				model.collision();
				settings.ctx.drawImage(settings.buffer, 0, 0, settings.width, settings.height);
			};
			loop();
		},
		// Устанавливает имя игрока
		showUIUserName: function(userName) {
			let userNameBlock = document.querySelector('.game-panel__username span');
			userNameBlock.innerHTML = userName;
		},
		// Отображает значение прочности корабля
		setUIHitPoint: function(points) {
			let durabilityBlock = document.querySelector('.game-panel__durability span');
			durabilityBlock.innerHTML = points;
		},
		// Отображает значение уровня сложности
		setUIDiffLVL: function() {
			let diffLVLBlock = document.querySelector('.game-panel__lvl span');
			diffLVLBlock.innerHTML = settings.diffLvl;
		},
		// Отображает кол-во набраных очков
		setUIPoints: function() {
			let scoreBlock = document.querySelector('.game-panel__score span');
			scoreBlock.innerHTML = Math.round(settings.userPoints);
		},
		// Отображает модалку с результатами
		resultModal: function(action) {
			if (action == 'show') {
				$('#gameOverModal').modal('show');
			}
			if (action == 'hide') {
				$('#gameOverModal').modal('hide');
			}
		},
		// Отображает UI панель
		showUIPanel: function() {
			let uiPanel = document.querySelector('.game-panel');
			uiPanel.style.display = 'block';
		},
		// показывает прогресс до начала игры
		showStartProgress: function() {
			let btnStart = document.querySelector('.js_start-game');
			let progressWrap = document.querySelector('.progress');
			let progressBar = progressWrap.querySelector('.progress-bar');
			btnStart.style.display = "none";
			progressWrap.style.display = "flex";
			model.runStartProgress(progressBar);
		},
		// устанавливает имя/результат игрока в модалку game over
		setUserResult: function() {
			let userNameBox = document.querySelector('.js_modalUserName');
			let userResultBox = document.querySelector('.js_modalUserResult');
			userNameBox.innerHTML = settings.name;
			userResultBox.innerHTML = Math.round(settings.userPoints);
		},
		// показывает таблицу результатов
		showResultTable: function(data) {
			let resultTable = document.querySelector('.js_result-table');
			let resultList = document.querySelector('.js_result-list');
			let counter = 1;
			resultList.innerHTML = '';
			resultTable.style.display = 'block';
			for (let key in data) {
				let resultListItem =	`<tr class="${key == settings.name ? 'current-player' : ''}">` +
											`<th>${counter}</th>` +
											`<td>${key}</td>` +
											`<td>${data[key]}</td>` +
										`</tr>`;
				resultList.insertAdjacentHTML("beforeEnd", resultListItem);
				counter++;
			}
		},
	};

	// CONTROLLER
	let controller = {
		uiElement: {
			inputName: document.querySelector('.js_input-name'),
			btnStart: document.querySelector('.js_start-game'),
			btnRestart: document.querySelector('.js_restart-game'),
			btnAddUserName: document.querySelector('.js_add-userName'),
			btnShowResultTaable: document.querySelector('.js_show-result-table'),
			modalGameStart: $('#gameStart'),
		},
		// стартовые события
		events: function () {
			// model.startDrow(); //!
			controller.uiElement.modalGameStart.modal('show'); //!
			controller.uiElement.btnStart.addEventListener('click', controller.startGame);
			controller.uiElement.btnRestart.addEventListener('click', controller.restartGame);
			controller.uiElement.btnAddUserName.addEventListener('click', controller.addUserName);
			controller.uiElement.btnShowResultTaable.addEventListener('click', controller.showResultTable);
			model.addSounds();
		},
		// добавление имени игрока
		addUserName: function(e) {
			e.preventDefault();
			if (!!controller.uiElement.inputName.value) {
				settings.name = controller.uiElement.inputName.value;
				controller.uiElement.btnStart.removeAttribute('disabled');
				model.showUIPanel();
				model.showUIUserName();
				
			}
			else {
				// TODO: доделать нормальное сообщение о невалидности имени игрока
				alert('Введите имя');
			}
		},
		// начало игры
		startGame: function(e) {
			e.preventDefault();
			model.showStartProgress();
		},
		// перезапуск игры
		restartGame: function(e) {
			e.preventDefault();
			model.restartGame();
		},
		// показывает таблицу результатов
		showResultTable: function(e) {
			e.preventDefault();
			model.showResultTable();
		},
	};

	let app = {
		init: function (userSettings) {
			// _setSettings(userSettings);
			controller.events();
		},
	}

	return app;

})();

MeteorFall.init();