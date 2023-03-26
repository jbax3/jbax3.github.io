function decodeText(text) {
  let rotations = [...Array(25).keys()];
  let result = '';
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (char.match(/[a-z]/i)) {
      // Calculate the rotation amount based on the index in the rotations list
      let rotation = rotations[i % rotations.length];
      let baseCharCode = char.match(/[a-z]/) ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0);
      let charCode = char.charCodeAt(0);
      let decodedCharCode = ((charCode - baseCharCode - rotation + 26) % 26) + baseCharCode;
      let decodedChar = String.fromCharCode(decodedCharCode);
      result += decodedChar;
    } else {
      // Non-alphabetic characters are unchanged
      result += char;
    }
  }
  return result;
}

fetch('./content.json')
  .then(response => response.json())
  .then(content => {
    const navbar = document.querySelector('.navbar');
    const navbarLinks = document.querySelector('.navbar');

    const grid = document.querySelector('.grid');

    // Get a list of all unique directory paths
    const directories = [...new Set(content.map(article => article.relative_path.split('/')[0]).filter(path => path !== ''))];

    // Create the top-level navbar links
    directories.forEach(directory => {
      const directoryLink = document.createElement('a');
      directoryLink.className = 'navbar-link';
      directoryLink.href = directory;
      directoryLink.dataset.path = directory;
      directoryLink.textContent = directory;
      navbarLinks.appendChild(directoryLink);
    });

    // Add event listeners to the top-level navbar links
    navbarLinks.querySelectorAll('.navbar-link').forEach(link => {
      link.addEventListener('mouseenter', () => {
        // Clear any existing submenus
        link.querySelectorAll('.navbar-submenu').forEach(submenu => submenu.remove());

        // Create a submenu for the hovered directory
        const submenu = document.createElement('div');
        submenu.className = 'navbar-submenu';

        // Get the full list of directories for the current hovered directory
        const currentDirectory = link.dataset.path;
        const subdirectories = [...new Set(content.filter(article => article.relative_path.startsWith(currentDirectory)).map(article => article.relative_path.split('/')[1]).filter(path => path !== undefined))];

        // Create links for each subdirectory
        subdirectories.forEach(subdirectory => {
          const subdirectoryLink = document.createElement('a');
          subdirectoryLink.className = 'navbar-sublink';
          subdirectoryLink.href = `${currentDirectory}/${subdirectory}`;
          subdirectoryLink.dataset.path = `${currentDirectory}/${subdirectory}`;
          subdirectoryLink.textContent = subdirectory;
          submenu.appendChild(subdirectoryLink);

          subdirectoryLink.addEventListener('click', event => {
            event.preventDefault();
            const path = subdirectoryLink.dataset.path;
            window.history.pushState({ path: path }, null, `/${path}`);
            populateGrid(path);
            event.stopPropagation();
          });
        });

        // Add the submenu to the navbar
        link.appendChild(submenu);
      });

      link.addEventListener('mouseleave', () => {
        // Remove the submenu when the mouse leaves the link
        link.querySelectorAll('.navbar-submenu').forEach(submenu => submenu.remove());
      });

      link.addEventListener('click', event => {
        event.preventDefault();
        const path = link.dataset.path;
        window.history.pushState({ path: path }, null, `/${path}`);
        populateGrid(path);
      });
    });

    // window.addEventListener('popstate', event => {
    //   const path = location.pathname;
    //   populateGrid(path);
    // });

    // Populate the grid with articles
    function populateGrid(path) {
      grid.innerHTML = '';
      content.forEach(article => {
        if (path === '' || article.relative_path.startsWith(path)) {
          const articleElement = document.createElement('div');
          articleElement.className = 'article';

          // If the article has an image, set it as the background image for the tile
          if (article.random_image) {
            articleElement.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url('${article.random_image}')`;
            articleElement.style.backgroundSize = 'cover';
            articleElement.style.backgroundPosition = 'center';
          }

          articleElement.innerHTML = `
            <h1>${article.title}</h1>
            <p>${article.quick_blurb}</p>
            <div class="tags">${article.tags.map(tag => tag).join(' ')}</div>
          `;

          articleElement.addEventListener('click', () => {
            const lock = document.getElementById("lock");
            console.log(lock.src)
            if (lock.src.split("/").pop() === "lock.svg") {
              decodeContent()
            };
            articleElement.classList.add('selected');
            grid.classList.add('selected');
            grid.innerHTML = `
              <div class="article selected">
                <h1>${article.title}</h1>
                <p>Published Date: ${article.published_date}</p>
                <div class="image-container">${article.html}</div>
              </div>
            `;
            currentArticleID = article.title;
            // Use pushState to update the URL with the new article ID
            path = article.relative_path;
            window.history.pushState({ path: path }, null, `/${path}/${currentArticleID}.md`);

          });

          grid.appendChild(articleElement);

          // Scroll to Top on Reload of Elements
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }
      });
    }

  window.addEventListener('popstate', event => {
    console.log(event.state)
    const path = event.state ? event.state.path : '';
    populateGrid(path);
  });

  function decodeContent() {
    content.forEach(article => {
      article.random_image = decodeText(article.random_image)
      article.html = decodeText(article.html)
    });

    // Get the lock element
    const lock = document.getElementById("lock");

    // Remove the listener, so it is a one-time action
    lock.removeEventListener('mouseover', unlock);

    // Change the icon
    lock.src = "/static_resources/unlock.svg"
  };

  function unlock() {
    // Decode all articles
    decodeContent()

    // Populate the grid at the original path
    populateGrid("")
  }

  const lock = document.getElementById("lock");
  lock.addEventListener("mouseover", unlock);

    // Initialize the grid with all articles
    populateGrid('');
  });
