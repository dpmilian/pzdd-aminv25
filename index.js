import storage from "node-persist";
import random from "random-seedable";
import crypto from "crypto";

const nombres = await import("./nombres.json", { assert: { type: "json" } });

var amigo_invisible = {};
const base_url = "https://amigo-invisible.ddns.net/ai";

let locked = true;
const password = "danieselmejor";

let assigned = 0;

const reasignar_nombres_aleatoriamente = () => {
  let candidatos = JSON.parse(JSON.stringify(nombres));
  amigo_invisible = {};
  for (const nombre of nombres) {
    const mis_candidatos = candidatos.filter(
      (candidato) => nombre !== candidato
    );
    const asignado = random.choice(mis_candidatos);
    amigo_invisible[nombre] = asignado;
    candidatos = candidatos.filter((nombre) => nombre !== asignado);
    // console.log("Remove", asignado);
  }

  storage.setItem("amigo_invisible_2024", amigo_invisible);

  assigned = random.int();
  storage.setItem("assigned_2024_1", assigned);
};

storage.init().then(() => {
  storage.getItem("assigned_2024_1").then((item) => {
    if (item) {
      assigned = item;
      console.log("Assigned", assigned);
    } else {
      console.log("Assigned doesn't exist, create new random set");
      storage.setItem("assigned_2024_1", assigned);
    }
  });
  storage.getItem("amigo_invisible_2024").then((item) => {
    if (item) {
      amigo_invisible = item;
      for (const nombre in amigo_invisible) {
        console.log(`${nombre} le regala a ${amigo_invisible[nombre]}`);
      }
    } else {
      console.log("Persistent data doesn't exist, create new random set");
      reasignar_nombres_aleatoriamente();
    }
  });
});

// *****************************************************************
// Import the framework and instantiate it
import Fastify from "fastify";
import fs from "fs";

const fastify = Fastify({
  logger: true,
});

const sorteo_html = fs.readFileSync("./pub/sorteo.html");

fastify.get("/", async function handler(request, reply) {
  reply.type("text/html").send(sorteo_html);
});
fastify.get("/lock/:pw", async function handler(request, reply) {
  const { pw } = request.params;
  if (pw === password) {
    locked = !locked;
    console.log(`Password correct, lock status: ${locked}`);
  }
  reply.type("text/html").send(`${locked ? "Locked" : "Unlocked"},${assigned}`);
});

fastify.get("/sorteo", async function handler(request, reply) {
  if (!locked) {
    reasignar_nombres_aleatoriamente();
  }
  reply.type("text/html").send(`${locked ? "Locked" : "Unlocked"},${assigned}`);
});

fastify.get("/soy/:hash_nombre", async function handler(request, reply) {
  const { hash_nombre } = request.params;
  for (const nombre in amigo_invisible) {
    const hash = crypto
      .createHash("md5")
      .update(nombre + "24")
      .digest("hex");
    if (hash_nombre === hash) {
      let to_send = `
                <div style="margin-left: auto; margin-right: auto; margin-top: 100px; font-size: 300%; text-align: center; font-family: Arial">
                <h2>Hola <b style="color: navy; text-transform: uppercase">${nombre}</b></h2>
                    <br/>    
                <img style='margin-left: auto; margin-right:auto; height:400; ' src='https://api.dicebear.com/9.x/bottts/svg?seed=${nombre}'></img>
                    <br/>`;
      if (locked) {
        to_send += `<h2>tienes que regalar a...</h2><br/><br/>
        <h1><b style="color: red; text-transform: uppercase"> ${amigo_invisible[nombre]}</b></h1>
    </div>`;
      } else {
        to_send +=
          "<h2>El sorteo no está cerrado aún, espera por más instrucciones!</h2>";
      }

      reply.type("text/html").send(to_send);
      return;
    }
  }
  reply.type("text/html").send(`<div>No sé quién eres!</div>`);
});

fastify.get("/todos", async function handler(request, reply) {
  let links = [];
  for (const nombre in amigo_invisible) {
    const hash_nombre = crypto
      .createHash("md5")
      .update(nombre + "24")
      .digest("hex");
    links.push(
      `<a href='${base_url}/soy/${hash_nombre}'>Link para ${nombre}</a><br/>`
    );
  }
  links.push(
    `<p><a href='${base_url}/sorteo'>Link para hacer el sorteo</a></p>`
  );

  reply
    .type("text/html")
    .send("<html><body>" + links.join("\n") + "</body></html>");
});

// Run the server!
const PORT = 443;

fastify.listen({ host: "0.0.0.0", port: 3000 }).catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
