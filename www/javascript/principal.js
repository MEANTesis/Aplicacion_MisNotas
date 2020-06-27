const ModuloPrincipal = angular.module("ModuloPrincipal", []);

// ------------------------------ SERVICIO ------------------------------------
ModuloPrincipal.factory("ServicioPrincipal", [function(){
    let servicioPrincipal = {
        token: localStorage.getItem('notasToken'),
        enviarPeticion: function(ruta, cuerpo, retrollamada){
            fetch(ruta, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cuerpo)
            }).then(function(objetoResponse){
                return objetoResponse.text();
            }).then(function(respuestaTexto){
                let respuesta = JSON.parse(respuestaTexto);
                retrollamada(respuesta);
            }).catch(function(error){
                console.error(error);
            });
        },
        crearNota: function(objetoNota, retrollamada){
            let cuerpo = {
                token: this.token,
                estructuraNota:{
                    titulo: objetoNota.titulo,
                    contenido: objetoNota.contenido,
                    esFija: objetoNota.esFija
                }
            };
            this.enviarPeticion('/api/crud/crear', cuerpo, retrollamada);
        },
        modificarNota: function(objetoNota, retrollamada){
            let cuerpo = {
                token: this.token,
                estructuraNota: {
                    _id: objetoNota._id,
                    titulo: objetoNota.titulo,
                    contenido: objetoNota.contenido,
                    esFija: objetoNota.esFija
                }
            };
            this.enviarPeticion('/api/crud/modificar', cuerpo, retrollamada);
        },
        eliminarNotas: function(idsNotas, retrollamada){
            let cuerpo = {
                token: this.token,
                ids: idsNotas
            };
            this.enviarPeticion('/api/crud/eliminar', cuerpo, retrollamada);
        },
        getNotas: function(retrollamada){
            let cuerpo = { token: this.token };
            this.enviarPeticion('/api/crud/getnotas', cuerpo, retrollamada);
        },
        setNotasFijas: function(idsNotas, retrollamada){
            let cuerpo = {
                token: this.token,
                ids: idsNotas
            };
            this.enviarPeticion('/api/crud/setnotasfijas', cuerpo, retrollamada);
        },
        getIdentidad: function(retrollamada){
            let cuerpo = { token: this.token };
            this.enviarPeticion('/api/crud/getidentidad', cuerpo, retrollamada);
        }
    };
    return servicioPrincipal;
}]);

// ------------------------------ CONTROLADOR ------------------------------------
ModuloPrincipal.controller("ControladorPrincipal", ['ServicioPrincipal', '$scope', function(servicioPrincipal, $scope){
    let proxy = this;
    // Estilo para difuminar toda la aplicación al mostrar una caja modal
    const estiloDifuminado = 'difuminar';
    // Ordena las notas para posicionar las notas fijas de primero (de la más reciente a la más antigua)
    const ordenarNotas = function(){
        proxy.empty = proxy.notas.length < 1;
        proxy.notasOrdenadas.sort(function(a, b){
            if(a.esFija) return -1;
            if(b.esFija) return 1;
            return 0;
        });
    };

    // Dividir las notas en filas para poder recorrerlas de una forma más intuitiva en la vista
    const trozear = function(){
        let longitudTotal = proxy.notasOrdenadas.length;
        let extra = longitudTotal % 4;
        let filas = (longitudTotal-extra)/4;
        let retorno = [];
        for(let i = 0; i < filas; i++){
            let actual = [];
            for(let j = 0; j < 4; j++){
                actual.push(proxy.notasOrdenadas[(i*4)+j]);
            }
            retorno.push(actual);
        }
        let datosExtra = [];
        for(let j = 0; j < extra; j++) datosExtra.push(proxy.notasOrdenadas[proxy.notasOrdenadas.length - extra + j]);
        retorno.push(datosExtra);
        return retorno;
    };

    // ------------ funciones basicas para modales
    const manejadorBase = {
        hacerPeticion: function(){
            switch(this.tipo){
                case 'crear':
                    servicioPrincipal.crearNota({
                        titulo: proxy.modalDatos.notaTitulo,
                        contenido: proxy.modalDatos.notaContenido,
                        esFija: proxy.modalDatos.notaEsFija? true:false
                    }, function(respuesta){
                        proxy.notas.push(respuesta.estructuraNota);
                        proxy.notasOrdenadas = proxy.notas;
                        ordenarNotas();
                        proxy.notasPorFilas = trozear();
                        $scope.$apply();
                    });
                    break;
                case 'modificar':
                    servicioPrincipal.modificarNota({
                        _id: proxy.modalDatos._id,
                        titulo: proxy.modalDatos.notaTitulo,
                        contenido: proxy.modalDatos.notaContenido,
                        esFija: proxy.modalDatos.notaEsFija?true:false
                    }, function(respuesta){
                        proxy.notas.push(respuesta.estructuraNota);
                        proxy.notasOrdenadas = proxy.notas;
                        ordenarNotas();
                        proxy.notasPorFilas = trozear();
                        $scope.$apply();
                    });
                    break;
                case 'eliminar':
                    break;
            }
            cerrarModal();
        },
        clickExterno: function(evt){
            this.cancelar(evt);
        },
        clickInterno: function(evt){
            evt.stopPropagation();
        },
        enviar: function(evt){
            evt.stopPropagation();
            this.hacerPeticion();
        },
        cancelar: function(evt){
            evt.stopPropagation();
            cerrarModal();
        }
    }

    const abrirModal = function({textoTipo, tipo, hacerPeticion}){
        proxy.estiloSegundoPlano = estiloDifuminado;
        proxy.modalDatos = Object.assign({textoTipo, tipo, hacerPeticion}, manejadorBase);
    };
    const cerrarModal = function(){
        proxy.modalDatos = null;
        proxy.estiloSegundoPlano = null;
    };
    // Obtener el arreglo de notas de sessionStorage
    proxy.notas = JSON.parse(sessionStorage.getItem('notas'));
    // Si el arreglo está vacío, empty es verdadero
    proxy.empty = proxy.notas.length < 1;
    proxy.notasOrdenadas = proxy.notas;
    proxy.estiloSegundoPlano = null;
    ordenarNotas();
    proxy.notasPorFilas = trozear();
    proxy.crearNota = function(){
        abrirModal({
            textoTipo: "Crear Nota",
            tipo: "crear"
        });
    };
    servicioPrincipal.getIdentidad(function(respuesta){
        proxy.datosUsuario = respuesta.usuario;
        proxy.nombreUsuario = respuesta.usuario.primerNombre + 
          (respuesta.usuario.primerApellido? ' ' + respuesta.usuario.primerApellido: '');
        $scope.$apply();
    });
}]);

// ------------------------------ DIRECTIVA NOTA ------------------------------------
ModuloPrincipal.directive("directivaNota", [function(){
    return {
        restrict: 'E',
        scope: {
            datosNota: '=informacion'
        },
        templateUrl: './recursos/nota.html'
    };
}]);

// ------------------------------ DIRECTIVA MODAL ------------------------------------
ModuloPrincipal.directive("directivaModal", [function(){
    return {
        restrict: 'E',
        scope: {
            referenciaNota: '=informacion'
        },
        templateUrl: './recursos/modal.html'
    };
}]);