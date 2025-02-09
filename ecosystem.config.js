module.exports = {
    apps : [{
        name: "grifeng",
        script: "server.js",
        user: "deploy",
        instances: "max",
        autorestart: true,
        watch: false,
        max_memory_restart: "500M",
        env_production: {
            NODE_ENV: "production"
        }
    }]
};