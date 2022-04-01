const chart = document.querySelector('#myChart')
const loading = document.querySelector('#loading')
const backendURL = "https://postgraph.chiroyce.repl.co"

const randomColor = () => {
    // Taken from https://www.tutorialspoint.com/generating-random-hex-color-in-javascript
    let color = '#';
    for (let i = 0; i < 6; i++) {
        const random = Math.random();
        const bit = (random * 16) | 0;
        color += (bit).toString(16);
    };
    return color;
};

const showError = () => {
    loading.style.display = "block";
    chart.style.display = "none";
    loading.innerHTML = "Oops, something went wrong,<br>this page will refresh automatically.<br>If it still isn't fixed, try again later."
    setTimeout(() => location.reload(), 5000);
}

async function updateChart() {
    let data;
    try {
        data = await fetch(`${backendURL}/data`)
    }
    catch {
        showError();
        return;
    }

    data = await data.json()
    let usernames = data.usernames;
    let posts = data.posts;
    data = { names: usernames, values: posts, duration: data.duration }
    // window.chart.data.datasets[0].label = `People with most number of posts in the last ${data.duration} hour(s)`
    window.chart.data.datasets[0].label = `People with most number of posts in the last 2 days`

    let colors = [];
    for (let i = 0; i != usernames.length; i++) {
        if (window.usernameCache[usernames[i]]) {
            colors[i] = window.usernameCache[usernames[i]]
            window.chart.data.datasets[0].backgroundColor = colors;
            window.chart.update()
            continue;
        }

        // Get the user's ocular color
        fetch(`https://my-ocular.jeffalo.net/api/user/${usernames[i]}`)
            .then((res) => res.json())
            .then((res) => {
                let color = res.color;
                if (color) {
                    window.usernameCache[usernames[i]] = color;
                    colors[i] = color;
                }
                else {
                    // If they didn't set one, give them a random color
                    color = randomColor();
                    colors[i] = color;
                    window.usernameCache[usernames[i]] = color;
                }
                window.chart.data.datasets[0].backgroundColor = colors;
                window.chart.update();
            })
            .catch((error) => {
                console.error(`Couldn't fetch Ocular status due to an error: ${error}`);
                color = randomColor();
                window.usernameCache[usernames[i]] = color;
                colors[i] = color;
                window.chart.data.datasets[0].backgroundColor = colors;
                window.chart.update();
            })
    }
    window.chart.data.labels = usernames;
    window.chart.data.datasets[0].data = posts;
    // Since this updates in real time, we also need to sync
    // usernames, postcounts and colors accurately
    window.chart.update()
}

async function createChart() {

    // Get data from server and sort by
    // descending order of post count    
    let data;
    try {
        data = await fetch(`${backendURL}/data`)
    }
    catch {
        showError();
        return;
    }

    data = await data.json()
    let usernames = data.usernames;
    let posts = data.posts;
    let label;
    if (data.duration === 0) {
        label = 'People with most number of posts in the last hour'
    }
    else {
        // label = `People with most number of posts in the last ${data.duration} hour(s)`
        label = `People with most number of posts in the last 2 days`
    }
    data = { names: usernames, values: posts, duration: data.duration }

    window.chart = new Chart(chart, {
        type: 'bar',
        data: {
            labels: data.names,
            datasets: [{ label: label, data: data.values }]
        },
    })

    loading.style.display = "none";
    document.getElementById('color').style.display = "block";
}

window.usernameCache = {}

createChart()
    .then(() => updateChart()
        .then(() => {
            setInterval(updateChart, 9000)
        })
    );
