class Router {
  constructor(nameweb, config){
    this.nameweb = nameweb;
    this.error_404 = config.error_404;
    this.routes = [];
    this.sesions = config.sesions_name ? config.sesions_name : "website-sesions";
    this.app = config.app;
  }
  get(route, func){
    let setArray = Array.isArray(route);
    if(setArray == true){
      route.forEach((element, i) => {
        this.routes.push({route: element, func: func});
      })
    }else {
      this.routes.push({route: route, func: func});
    }
  }
  start(){
    if(!this.app) return console.log(new Error('App is not defined'));
    var newHash = window.location.hash; 
    let titleChanged = document.querySelector('title').innerHTML = `${this.nameweb ? this.nameweb : "WebSite"} | ${newHash != '' ? newHash.slice(2).toUpperCase() : "Home"}`;
    let suroute = newHash.slice(1) ? newHash.slice(1) : "";

    let sesions = document.querySelector(`${this.app}`);
    
    let finding = this.routes.find(ch => ch.route == suroute);
    if(!finding){
      sesions.innerHTML = `
        ${this.error_404?this.error_404:"<div>Pagina No Encontrada</div>"}
      `;
    }else {
      sesions.innerHTML = `${finding.func({route: suroute, finder: finding})}`;
    }
  }
  listen(){
    window.addEventListener("hashchange", () => {
      this.start()
    });
  }
  go(route){
    location.location.hash = `/${route}`;
  }
}

function converterArray(object) {
  let keys = Object.keys(object);
  let arrayToReturn = [];

  keys.forEach((element, i, array) => {
    arrayToReturn.push(object[element]);
  })

  return arrayToReturn;
}

const encrypt = (salt, text) => {
  const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
  const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
  const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
  return text
    .split("")
    .map(textToChars)
    .map(applySaltToChar)
    .map(byteHex)
    .join("");
};

const decrypt = (salt, encoded) => {
  const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
  const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
  return encoded
    .match(/.{1,2}/g)
    .map((hex) => parseInt(hex, 16))
    .map(applySaltToChar)
    .map((charCode) => String.fromCharCode(charCode))
    .join("");
};

class database {
  users(){
    const dataUser = localStorage.getItem('horaryManager/users');

    let finalToReturn = dataUser?JSON.parse(dataUser):{};

    return finalToReturn;
  }
  ids(){
    const idsHorary = localStorage.getItem('horaryManager/ids');

    let finalToreturn = {
      users: 0,
      task: 0,
      days: 0,
      anothers: 0,
      facts: 0,
      notifications: 0
    };

    if(!idsHorary){
      localStorage.setItem('horaryManager/ids', JSON.stringify(finalToreturn));

      return finalToreturn;
    }else {
      return idsHorary?JSON.parse(idsHorary):finalToreturn;
    }
  }
  findingUser(user, password){
    let usering = this.users();
    let finalArray = converterArray(usering);

    let findingUsering = finalArray.find(ch => ch.user == user && ch.password == encrypt('horaryManager',password));

    if(!findingUsering) return {message: "Parece que este usuario no existe."};

    return {message: "Sesion iniciada satisfactoriamente", data: findingUsering};
  }

  setDataUsers(data){
    localStorage.setItem('horaryManager/users', JSON.stringify(data));

    return data;
  }
  setData(name, data){
    localStorage.setItem(name, JSON.stringify(data));
  }
  createUser(user, password){
    let usering = this.users();
    let finding = this.findingUser(user, password);
    if(finding.data) return {message: "Este usuario ya existe."};

    let ids = this.ids();

    ids.users = ids.users + 1;
    usering[ids.users] = {
      user: user, 
      password: encrypt('horaryManager', password),
      days: {
        lunes: {},
        martes: {},
        miercoles: {},
        jueves: {},
        viernes: {},
        sabado: {},
        domingo: {}
      },
      notifications: {},
      anothers: {},
      services: {},
      token: encrypt(user, `${password}+${new Date().toString()}`),
      created: new Date().toString(),
      id: ids.users
    }

    this.setData('horaryManager/users', usering);
    this.setData('horaryManager/ids', ids);

    return usering[ids.users];
  }
  setSession(token){
    localStorage.setItem('horaryManager/session', token);

    location.reload();

    return token;
  }
  getToken(token){
    let usering = converterArray(this.users());

    let findingByToken = usering.find(ch => ch.token == token);

    if(!findingByToken) return {message: "Este token no es valido, inicia sesion de nuevo"};

    return {message: "Sesion Iniciada", data: findingByToken};
  }

  getAllUsers(){
    return localStorage.getItem('horaryManager/users')?JSON.parse(localStorage.getItem('horaryManager/users')):{};
  }
}

const router = new Router('HoraryManager', {
  nameweb: "Horary Manager |",
  app: ".app",
  error_404: "<h1>Error, Pagina deshabilitada</h1>"
});

const admin = new database();

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
  showClass: {
    popup: '' // Desactivar animación de entrada
  },
  hideClass: {
    popup: '' // Desactivar animación de salida
  }
});

const alert = Swal.mixin({
  customClass: {
    popup: 'shadow',
    confirmButton: 'btn btn-outline-primary',
    cancelButton: 'btn btn-outline-danger'
  },
  confirmButtonText: "Aceptar",
  cancelButtonText: "Cancelar",
  buttonsStyling: false,
  showClass: {
    popup: '' // Desactivar animación de entrada
  },
  hideClass: {
    popup: '' // Desactivar animación de salida
  },
  inputAttributes: {
    class: "numberify-input-commas",
    type: "text"
  }
});

function iniciarSesion(e){
  e.preventDefault();

  let data = {
    user: e.target[0].value,
    password: e.target[1].value
  }

  let findingUsering = admin.findingUser(data.user, data.password);

  if(!findingUsering.data) {
    alert.fire({
      text: "Este usuario no existe, ¿deseeas crear uno?",
      icon: "info",
      showCancelButton: true,
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if(result.isConfirmed){
        alert.fire({
          title: "¿Deseas crear el usuario con estos datos?",
          text: "¿Vas a crear el usuario con los mismos datos que digitaste?, esto se puede cambiar despues, pero si no quieres tener problemas para iniciar sesion despues o perder los datos. Cambia los datos desde el inicio de sesion.",
          icon: "info",
          showCancelButton: true,
          footer: "Al dar aceptar el usuario se iniciara sesion al instante"
        }).then((result) => {
          if(result.isConfirmed){
            let finalUser = admin.createUser(data.user, data.password);
            admin.setSession(finalUser.token);
          }
        })
      }
    })
  }else {
    admin.setSession(findingUsering.data.token);
  }
}

function disableLoginApp(){
  document.querySelector('.disable-application-login').classList.add('disable-login-app');
}

router.get(['/', '', ' '], () => {
  let session = admin.getToken(localStorage.getItem('horaryManager/session'));
  if(!session.data) return `<div class="container">
    <br><br>
    <h1 class="text-center">Error en la aplicación</h1>
    <p>Reabre la aplicación para que puedas usarla.</p>
    </div>`;

  let simpleUser = session.data;

  let servicesArray = converterArray(simpleUser.services);
  let filterArray = servicesArray.filter(ch => ch.date);

  let ultimateFilter = servicesArray.filter(ch => {
    return new Date(ch.date).toLocaleDateString() == new Date(new Date()-timems('1d')).toLocaleDateString();
  });

  ultimateFilter.sort((a, b) => {
    // Comparar las fechas
    const fechaA = new Date(a.date);
    const fechaB = new Date(b.date);
    if (fechaA < fechaB) return -1;
    if (fechaA > fechaB) return 1;
    // Si las fechas son iguales, comparar por urgencia
    return prioridadUrgencia[b.urgencia] - prioridadUrgencia[a.urgencia];
  });

  let notificaciones = converterArray(simpleUser.notifications);
  let ultimas3 = [notificaciones[notificaciones.length-1], notificaciones[notificaciones.length-2], notificaciones[notificaciones.length-3]];

  console.log(ultimas3)

  return `<div class="container">
    <br><br>
    <h1 class="text-center">Bienvenido ${simpleUser.user}</h1>
    <p class="text-center">Revisa lo que tienes que hacer hoy y se mas productivo en tu dia a dia.</p>
    <br>
    <h5>Tareas de hoy</h5>
    <hr>
    <div class="services">
      ${!ultimateFilter[0]?"No hay ninguna tarea para hoy":ultimateFilter.map(ch => `
        <div class="card cursor-pointer" onclick="viewTarea('${ch.id}')">
          <div class="card-body">
            <span>${ch.title}</span>-
            <span class="cl-${ch.urgencia} cl-card">${ch.urgencia}</span>
          </div>
        </div>
      `).join('<br>')}
    </div>
    <br>
    <h5>Notificaciones</h5>
    <hr>
    <div class="services-2">
      ${!ultimas3[0]?"No hay notificaciones":`
        <ul class="list-group">
          ${ultimas3.map(ch => `
            <li class="list-group-item">
              ${ch.message}
            </li>
          `).join('')}
        </ul>
      `}
    </div>
  </div>`;
});

function submitCreateTarea(e){
  e.preventDefault();

  let finalSubmit = {
    title: e.target[0].value,
    description: e.target[1].value,
    urgencia: e.target[2].value,
    date: e.target[3].value,
    img: e.target[4].value
  };

  let session = localStorage.getItem('horaryManager/session');
  let findingToken = admin.getToken(session);
  let useringJustNow = findingToken.data;

  if(!useringJustNow) alert.fire({
    title: "Error de usuario",
    text: "Hay alguna anomalia con tu usuario, inicia sesion de nuevo.",
    icon: "error",
    footer: "Este mensaje solo aparece si se borro algún dato importante de tu usuario."
  });

  let ids = admin.ids();
  let allData = admin.getAllUsers();

  ids.task = ids.task + 1;

  finalSubmit.id = ids.task;

  const file = event.target[4].files[0];

  if (file) {
    const reader = new FileReader();
    // Cuando el archivo se ha leído completamente
    let finalID = new Date()-0;
    reader.onload = function(e) {
      // Crear una imagen y asignarle la fuente
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = file.name;
      localStorage.setItem(`file-${finalID}`, e.target.result);
    };
    // Leer el archivo como una URL de datos base64
    let dataURL = reader.readAsDataURL(file);

    finalSubmit.finalFile = `file-${finalID}`;
    
  }

  allData[useringJustNow.id].services[ids.task] = finalSubmit;
  // SETTING DATA
  admin.setData('horaryManager/ids', ids);
  admin.setData('horaryManager/users', allData);

  location.href = "#/lista-tareas";

  return allData[useringJustNow];
}

router.get('/create-tarea', () => {
  return `
    <br>
    <form action="" class="container-fluid" onsubmit="submitCreateTarea(event)">
      <label htmlFor="">Titulo De La Tarea</label>
      <div class="input-group mb-3">
        <span class="input-group-text" id="basic-addon1">
          <?xml version="1.0" encoding="UTF-8"?>
          <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24">
            <path d="m20,0H4C1.794,0,0,1.794,0,4v12c0,2.206,1.794,4,4,4h2.923l3.748,3.156c.382.34.862.509,1.338.509.467,0,.931-.163,1.292-.485l3.846-3.18h2.853c2.206,0,4-1.794,4-4V4c0-2.206-1.794-4-4-4Zm2,16c0,1.103-.897,2-2,2h-3.212c-.232,0-.458.081-.637.229l-4.172,3.415-4.047-3.409c-.18-.152-.408-.235-.644-.235h-3.289c-1.103,0-2-.897-2-2V4c0-1.103.897-2,2-2h16c1.103,0,2,.897,2,2v12Zm-2-10c0,.553-.447,1-1,1h-4c-.553,0-1-.447-1-1s.447-1,1-1h4c.553,0,1,.447,1,1Zm-2,8c0,.553-.447,1-1,1h-2c-.553,0-1-.447-1-1s.447-1,1-1h2c.553,0,1,.447,1,1Zm2-4c0,.553-.447,1-1,1h-4c-.553,0-1-.447-1-1s.447-1,1-1h4c.553,0,1,.447,1,1Zm-9.915-4.337c-.227-.995-1.065-1.663-2.085-1.663s-1.858.668-2.085,1.661l-2.101,9.114c-.124.538.212,1.075.75,1.199.539.127,1.075-.211,1.199-.75l.511-2.217h3.51l.532,2.225c.11.459.52.768.972.768.077,0,.155-.009.233-.027.537-.129.869-.668.74-1.205l-2.176-9.104Zm-3.35,5.345l1.129-4.899c.01-.046.024-.108.135-.108s.125.062.138.118l1.169,4.89h-2.571Z"/>
          </svg>
        </span>
        <input type="text" class="form-control" placeholder="Titulo de la tarea" aria-label="Username" aria-describedby="basic-addon1">
      </div>
      <label htmlFor="">Descrición de la tarea</label>
      <textarea name="" class="form-control" placeholder="Descripción de la tarea" id=""></textarea>
      <br>
      <label htmlFor="">Elige la urgencia de la tarea</label>
      <select name="" class="form-select" id="">
        <option value="leve">Leve</option>
        <option value="moderado">Moderado</option>
        <option value="urgencia">Urgente</option>
        <option value="maxima">Maxima Prioridad</option>
      </select>
      <label htmlFor="">Elige La Fecha De Entrega</label>
      <input type="date" class="form-control">
      <label htmlFor="">Imagen de la tarea</label>
      <input type="file" class="form-control">
      <br>
      <button class="btn btn-app btn-block">Guardar</button>
    </form>
  `;
})

function viewTarea(id){
  let gettingToken = admin.getToken(localStorage.getItem('horaryManager/session'));
  let allData = admin.getAllUsers();

  let finalUsering = gettingToken.data;

  if(!finalUsering) return Toast.fire({
    title: "error de aplicación",
    text: "Parece que el token de usuario expiro o ya no existe, vuelve a iniciar sesion",
    icon: "error"
  });

  let findingService = allData[finalUsering.id].services[id];
  console.log(findingService)

  alert.fire({
    imageUrl: localStorage.getItem(findingService.finalFile),
    title: findingService.title,
    text: findingService.description?findingService.description:"No hay descripción.",
    footer: findingService.urgencia,
    confirmButtonText: "Marcar Como Hecha",
    showCancelButton: true,
    cancelButtonText: "Cerrar"
  }).then(result => {
    if(result.isConfirmed){
      let gettingToken = admin.getToken(localStorage.getItem('horaryManager/session'));
      let allData = admin.getAllUsers();
      let ids = admin.ids();

      ids.facts = ids.facts + 1;

      let finalUsering = gettingToken.data;
      let finalToSend = allData[finalUsering.id].services[id];

      delete allData[finalUsering.id].services[id];

      admin.setData('horaryManager/users', allData);

      document.querySelector('.app').innerHTML = updateListaTareas();

      Toast.fire({
        text: "Tarea marcada como hecha",
        icon: "success"
      })

      settingNotificaction({
        message: "Nota marcada como hecha",
        type: "mark-check"
      }, finalToSend);
    }
  })
}

function setNotification(number){
  document.querySelector('.setting-notificaciones').innerHTML = `<span class="badge">${number?number:1}</span>`;
}

function settingNotificaction(message, data){
  let ids = admin.ids();
  ids.facts = ids.facts + 1;

  let gettingToken = admin.getToken(localStorage.getItem('horaryManager/session'));
  let allData = admin.getAllUsers();

  let finalUsering = gettingToken.data;

  if(!finalUsering) return Toast.fire({
    text: "Parece que el token es invalido",
    icon: "error"
  });

  allData[finalUsering.id].notifications[ids.facts] = {
    message: message.message,
    type: message.type,
    date: new Date().toString(),
    data: data
  }

  admin.setData('horaryManager/users', allData);
  admin.setData('horaryManager/ids', ids);

  Toast.fire({
    text: message.message,
    icon: "success"
  })

  setNotification();
}

function deleteTarea(id){
  let gettingToken = admin.getToken(localStorage.getItem('horaryManager/session'));
  let allData = admin.getAllUsers();

  let finalUsering = gettingToken.data;
  if(!finalUsering) return Toast.fire({
    title: "Error de aplicación",
    text: "Parece que el token de usuario expiro o ya no existe, vuelve a iniciar sesion",
    icon: "error"
  });

  alert.fire({
    title: "Eliminar Nota",
    text: "Estas seguro de que la quieres eliminar",
    confirmButtonText: "Si",
    showCancelButton: true,
    cancelButtonText: "No",
  }).then((result) => {
    if(result.isConfirmed){
      let finalToSend = allData[finalUsering.id].services[id];

      delete allData[finalUsering.id].services[id];
      admin.setData('horaryManager/users', allData);
      document.querySelector('.app').innerHTML = updateListaTareas();

      settingNotificaction({
        message: 'Se elimino una nota',
        type: "delete-check"
      }, finalToSend);

      Toast.fire({
        text: "Tarea eliminada satisfactoriamente",
        icon: "success"
      })
    }
  })
}

function updateListaTareas() {
  let gettingToken = admin.getToken(localStorage.getItem('horaryManager/session'));
  let allNotifications = converterArray(gettingToken.data.services);

  const prioridadUrgencia = {
    "leve": 1,
    "moderado": 2,
    "urgencia": 3,
    "maxima": 4
  };

  allNotifications.sort((a, b) => {
    // Comparar las fechas
    const fechaA = new Date(a.date);
    const fechaB = new Date(b.date);
    if (fechaA < fechaB) return -1;
    if (fechaA > fechaB) return 1;
    // Si las fechas son iguales, comparar por urgencia
    return prioridadUrgencia[b.urgencia] - prioridadUrgencia[a.urgencia];
  });

  return `
    <div class="container">
      <br><br>
      <h3>Lista de tareas</h3>
      <p>Agrega tareas de todos los dias, y haz que nuestro aplicativo te recuerde los que haceres.</p>
      <div class="text-center">
        <a class="btn btn-app" href="#/create-tarea">Agregar Tarea</a>
      </div>
      <br>
      <br>
      <div class="list-tareas-pendientes">${!allNotifications[0]?"<p>No hay ninguna tarea registrada, empieza ya a organizar tu dia.</p>":allNotifications.map(ch => `<div data-selected="false" class="card">
          <div class="card-body">

            <h5 class="card-title">${ch.title?ch.title:"Tarea por hacer"}</h5>
            <p>${ch.description?ch.description:"No hay descripción."}</p>
            <p>${new Date(ch.date) == "Invalid Date"?"No hay fecha de entrega.":`<div class="cl-card cl-${ch.urgencia}">${ch.urgencia}</div> Fecha: ${new Date(ch.date).toLocaleString()}`}</p>

            <button class="btn btn-sm btn-app" onclick="viewTarea('${ch.id}')">Ver</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTarea('${ch.id}')">Eliminar</button>

          </div>
        </div>`).join('<br>')}</div>
    </div>
  `;
}

router.get('/lista-tareas', () => {
  return updateListaTareas();
});

router.get('/notificaciones', () => {
  let getToken = admin.getToken(localStorage.getItem('horaryManager/session'));
  let usering = getToken.data;

  if(!usering) return Toast.fire({
    text: "Token Invalido",
    icon: "error"
  });

  let allData = admin.getAllUsers()[usering.id];
  let allNotify = converterArray(allData.notifications);

  return `
    <br>
    <div class="container-fluid">
      <h5 class="text-center">Notificaciones</h5>
      <p class="text-center">Todas las notificaciones y acciones hechas en la aplicación</p>
      <ul class="list-group">
        ${allNotify.map(ch => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            ${ch.message}
            <span class="badge bg-primary rounded-pill">1</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
});

router.get('/configs', () => {
  let pageConfigs = localStorage.getItem('page-configs')?JSON.parse(localStorage.getItem('page-configs')):{
    dark: false,
    notifications: false,
    renderer: false
  };

  return `
    <br>
    <h5 class="text-center">Configuraciones</h5>

  `;  
})

function sendingNotification(dataNotify){
  if (Notification.permission === "granted") {
    const opciones = {
      body: dataNotify.message,
      icon: "https://example.com/icon.png", // Icono de la notificación
      vibrate: [200, 100, 200], // Vibración para dispositivos móviles
      tag: dataNotify.tag // Evita duplicados de notificaciones
    };

    // Crear la notificación
    const notificacion = new Notification(dataNotify.title, opciones);

    // Agregar un evento cuando se hace clic en la notificación
    notificacion.onclick = function() {
      window.focus(); // Hacer que la pestaña de la app se enfoque
      console.log("Notificación clickeada");
    };
  }
}

window.onload = () => {
  let session = localStorage.getItem('horaryManager/session');
  let airLetter = document.querySelector('body');
  let menuLetter = document.querySelector('.app-menu');
  airLetter.classList.add('active-body');

  if(session){
    let validateSession = admin.getToken(session);

    if(!validateSession.data){
      Toast.fire({
        text: "Sesion Erronea, vuelve a iniciar sesion",
        icon: "error"
      })
    }else {
      disableLoginApp();
      menuLetter.classList.add('active-menu');

      router.listen();
      router.start();
    }
  }

  if ("Notification" in window) {
    // Pedir permiso al usuario
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        // Crear una notificación de prueba
        new Notification("¡Gracias por permitir las notificaciones!");
      } else if (permission === "denied") {
        console.log("El usuario ha denegado el permiso para las notificaciones.");
      }
    });
  } else {
    console.log("Este navegador no soporta notificaciones.");
  }
}
