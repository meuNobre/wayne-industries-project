const user = JSON.parse(localStorage.getItem("user"));

if(!user){
    window.location.href = '/frontend/index.html';
} 

fetch("http://localhost:5000/resources", {
    headers: {
        'X-User-Id': user.id
    }
})
.then (res => res.json())
.then (data => {
    renderResources(data);
});

document.getElementById('createResourceForm').addEventListener('submit', e => {
    e.preventDefault();

    fetch('http://127.0.0.1:5000/resources', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id
        },
        body: JSON.stringify({
            name: name.value,
            description: description.value
        })
    }).then(() => location.reload());
});


function renderResources(resources){
    const list = document.getElementById('resourceList');
    list.innerHTML = '';
    resources.forEach(resource => {
        const li = document.createElement('li');
        li.textContent = `${resource.name} - ${resource.status}`;
        list.appendChild(li);
    });
}
