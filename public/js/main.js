document.addEventListener("DOMContentLoaded", async function () {
    let points = [];
    let originalPoints = [];
    let currentUser = null;
    const svg = document.getElementById("drawing-area");
    const shapeSelect = document.getElementById("shapeSelect");
    const revertButton = document.getElementById("revert");
    const infoDiv = document.getElementById("info");
    const toggleButton = document.getElementById("toggleTable");
    const tableContainer = document.getElementById("table-container");
    const userDisplay = document.getElementById("yourname");

    async function getCurrentUser() {
        try {
            const response = await fetch("/current-user", { credentials: "include" });
            if (!response.ok)  new Error("User not authenticated");
            currentUser = await response.json();
            if (userDisplay) {
                userDisplay.textContent = `Logged in as: ${currentUser.username}`;
            }
        } catch (error) {
            console.warn("No user logged in.");
        }
    }

    toggleButton.addEventListener("click", async () => {
        if (tableContainer.style.display === "none") {
            infoDiv.style.display = "none"; // Hide form
            tableContainer.style.display = "block"; // Show table
            await displayTable();
        } else {
            infoDiv.style.display = "block"; // Show form
            tableContainer.style.display = "none"; // Hide table
        }
    });

    async function loadShapes() {
        const response = await fetch("/shapes");
        const shapes = await response.json();
        shapeSelect.innerHTML = '<option value="">-- Select a shape --</option>';
        shapes.forEach((shape, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = `${shape.userName} - ${shape.shapeName}`;
            shapeSelect.appendChild(option);
        });
        return shapes;
    }

    async function displayTable() {
        const shapes = await loadShapes();
        tableContainer.innerHTML = ""; // Clear previous data

        const table = document.createElement("table");
        table.style.borderCollapse = "collapse";

        const headerRow = document.createElement("tr");
        ["User", "Shape Name", "Description", "Self Titled?", "Points"].forEach((text) => {
            const th = document.createElement("th");
            th.textContent = text;
            headerRow.appendChild(th);
        });

        table.appendChild(headerRow);

        shapes.forEach((shape) => {
            const row = document.createElement("tr");

            [shape.userName, shape.shapeName, shape.description || "N/A", shape.selfTitled, shape.shape].forEach((text) => {
                const td = document.createElement("td");
                td.textContent = text;
                row.appendChild(td);
            });

            row.addEventListener("click", () => {
                points = shape.shape.split(" ");
                renderPolygon();
            });

            table.appendChild(row);
        });

        tableContainer.appendChild(table);
    }

    shapeSelect.addEventListener("change", async function () {
        const selectedShapeIndex = shapeSelect.value;
        if (selectedShapeIndex !== "") {
            const shapes = await loadShapes();
            const shapeData = shapes[selectedShapeIndex].shape.split(" ");
            originalPoints = [...points];
            points = shapeData;
            renderPolygon();
        }
    });

    revertButton.addEventListener("click", function () {
        points = [...originalPoints];
        renderPolygon();
    });

    const submit = async function (event) {
        event.preventDefault();
        if (!currentUser) {
            alert("You must be logged in to submit a shape.");
            return;
        }
        console.log(currentUser.username);
        const shapeName = document.querySelector("#shapename"),
          descriptionText = document.querySelector("#description");

        const response = await fetch("/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(json = {
                userName: currentUser.username,
                shapeName: shapeName.value,
                shape: points.join(" "),
                description: descriptionText.value
            })
        });

        console.log("Response:", await response.text());
        await loadShapes();
    };

    const button = document.getElementById("submit");
    button.onclick = submit;

    svg.addEventListener("click", (event) => {
        const svgRect = svg.getBoundingClientRect();
        const x = event.clientX - svgRect.left;
        const y = event.clientY - svgRect.top;

        points.push(`${Math.round(x)},${Math.round(y)}`);
        renderPolygon();
    });

    function renderPolygon() {
        svg.innerHTML = "";
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", points.join(" "));
        polygon.setAttribute("fill", "rgba(255, 255, 255, 0.3)");
        polygon.setAttribute("stroke", "white");
        polygon.setAttribute("stroke-width", "2");
        svg.appendChild(polygon);
    }

    await getCurrentUser();
    await loadShapes();
});
