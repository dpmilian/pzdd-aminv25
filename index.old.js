import storage from 'node-persist';
import random from 'random-seedable';
import crypto from 'crypto';

const nombres = ['Clara', 'Isa', 'Daniel', 'Adri', 'Luli', 'Xoel', 'Sheila', 'Jose', 'David', 'Thais', 'María Dolores', 'María Teresa', 'Manolito el Guapo', 'Lolita'];
var amigo_invisible = {};
const base_url = "https://pzdd.ddns.net/ai";

const reasignar_nombres_aleatoriamente = () => {

    let candidatos = JSON.parse(JSON.stringify(nombres));
    amigo_invisible = {};
    for (const nombre of nombres) {
        const mis_candidatos = candidatos.filter((candidato) => nombre !== candidato);
        const asignado = random.choice(mis_candidatos);
        amigo_invisible[nombre] = asignado;
        candidatos = candidatos.filter((nombre) => nombre !== asignado);
        console.log("Remove",asignado);
    }

    storage.setItem('amigo_invisible_2023', amigo_invisible);
}

storage.init().then(() => {
    storage.getItem('amigo_invisible_2023').then((item) => {
        if (item) {
            amigo_invisible = item;
            for (const nombre in amigo_invisible) {
                console.log(`${nombre} le regala a ${amigo_invisible[nombre]}`);
            }
        } else {
            console.log("Persistent data doesn't exist, create new random set");
            reasignar_nombres_aleatoriamente();
        }


    })
});


// *****************************************************************
// Import the framework and instantiate it
import Fastify from 'fastify';

const fastify = Fastify({
    logger: true
})

fastify.get('/sorteo', async function handler(request, reply) {

    reasignar_nombres_aleatoriamente();
    reply.type('text/html')
        .send(`<div>Realizado el sorteo y asignado destinatarios de regalo. No le des al link otra vez a menos que estés segura y cierra la ventana del explorador!</div>`);

});

fastify.get('/soy/:hash_nombre', async function handler(request, reply) {
    const { hash_nombre } = request.params;
    for (const nombre in amigo_invisible) {
        const hash = crypto.createHash('md5').update(nombre).digest('hex');
        if (hash_nombre === hash) {
            reply.type('text/html').send(`<div>Hola ${nombre} tienes que regalar a ${amigo_invisible[nombre]}</div>`);
            return;
        }
    }
    reply.type('text/html').send(`<div>No sé quién eres!</div>`);
})

fastify.get('/todos_links', async function handler(request, reply) {
    let links = [];
    for (const nombre in amigo_invisible) {
        const hash_nombre = crypto.createHash('md5').update(nombre).digest('hex');
        links.push(`<a href='${base_url}/soy/${hash_nombre}'>Link para ${nombre}</a><br/>`);
    }
    links.push(`<p><a href='http://${base_url}/sorteo'>Link para hacer el sorteo</a></p>`);

    reply.type('text/html').send("<html><body>" + links.join("\n") + "</body></html>");

});

// Run the server!
fastify.listen({host: '0.0.0.0', port: 3000 }).catch((err) => {
    fastify.log.error(err);
    process.exit(1);
});
