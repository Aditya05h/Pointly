const orbit = document.querySelector('.orbit');
window.pointlyOverlay?.getSettings().then((settings) => { orbit.dataset.avatar = settings.avatar; });
function openAvatarMenu(event) {
	event.preventDefault();
	window.pointlyOverlay?.showMenu();
}

orbit.addEventListener('click', openAvatarMenu);
orbit.addEventListener('contextmenu', openAvatarMenu);
