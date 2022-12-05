/*
    ROSEARCH

    Created by: morgan#1000
    Version: 1.0
*/

console.log("ROSEARCH: Content script loaded\n\nCreated by: morgan#1000\nVersion: 1.0\n\nThanks for installing!");

/* Inserts & Creating Elements */
let ServerListBody = document.getElementsByClassName("server-list-options")[0];

let Div = document.createElement("div");
Div.classList.add("RoSearch");
ServerListBody.appendChild(Div);

let SearchInput = document.createElement("input");
SearchInput.type = "text";
SearchInput.placeholder = "Search username";
SearchInput.classList.add("SearchInput");
SearchInput.classList.add("input-field");

let SearchButton = document.createElement("button");
SearchButton.innerText = "Search";
SearchButton.classList.add("btn-control-md");

Div.appendChild(SearchInput);
Div.appendChild(SearchButton);

/* Search Function */
SearchButton.addEventListener("click", Search)
SearchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        SearchButton.click();
    }
});

async function Search() {
    let TextEntered = SearchInput.value;
    SearchInput.disabled = true;
    SearchInput.value = 'Searching...'

    let UserId = (await (await fetch('https://api.roblox.com/users/get-by-username?username=' + TextEntered)).json())
    if (UserId.success == false) {
        return MessageOnInputBox("User not found")
    }
    UserId = UserId.Id;
    let UserPresence = (await (await fetch('https://presence.roblox.com/v1/presence/users', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userIds: [UserId]
        })
    })).json()).userPresences[0].userPresenceType;

    if (UserPresence != 2) {
        return MessageOnInputBox("User isn't in-game")
    }

    let UserThumbnail = (await fetch('https://www.roblox.com/headshot-thumbnail/image?width=48&height=48&format=png&userId=' + UserId)).url;

    let GameId = window.location.pathname.split("/")[2];

    let GameInstances = (await (await fetch(`https://games.roblox.com/v1/games/${GameId}/servers/Public?limit=100`)).json())

    let Done3 = false;

    let NextCursor = GameInstances.nextPageCursor
    if (NextCursor) {
        GameInstances = GameInstances.data

        while (NextCursor) {
            let NextPage = (await (await fetch(`https://games.roblox.com/v1/games/${GameId}/servers/Public?cursor=${NextCursor}`)).json())
            GameInstances = GameInstances.concat(NextPage.data)
            NextCursor = NextPage.nextPageCursor
        }
        Done3 = true;
    }
    else {
        GameInstances = GameInstances.data
        Done3 = true;
    }

    while (!Done3) {
        setInterval(() => {}, 1000)
    };

    let Found = false;
    let Done = false;

    for (let index = 0; index < GameInstances.length; index++) {
        const Instance = GameInstances[index];

        if (Found) return;

        let PlayerTokens = Instance.playerTokens;
        let BatchData = []

        await PlayerTokens.forEach(Token => {
            BatchData.push({
                requestId: Token,
                targetId: 0,
                token: Token,
                type: "AvatarHeadShot",
                size: "48x48",
                format: "png",
            })
        })

        let BatchDataJson = JSON.stringify(BatchData);

        let BatchDataResponse = (await (await fetch("https://thumbnails.roblox.com/v1/batch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: BatchDataJson
        })).json())

        await BatchDataResponse.data.forEach(ThumbnailData => {
            if (ThumbnailData.imageUrl == UserThumbnail) {
                let ServersContainer = document.getElementById('rbx-game-server-item-container')
                Found = true;
                
                let ImagesHTML = ``;
                let Done2 = false;
                let Amount = 4;
                for (let index = 0; index < Amount; index++) {
                    const ThumbData = BatchDataResponse.data[index];
                    if (ThumbData.imageUrl == UserThumbnail) {
                        Amount ++;
                    }
                    else {
                        ImagesHTML += 
                        `<span class="avatar avatar-headshot-md player-avatar">
                            <span class="thumbnail-2d-container avatar-card-image">
                                <img class="" src="${ThumbData.imageUrl}" alt="" title="">
                            </span>
                        </span>`
                    }
                    if (index == 3) {
                        Done2 = true;
                    }
                };

                while (!Done2);

                let PercentageFull = (Instance.playing / Instance.maxPlayers) * 100;

                ServersContainer.innerHTML = `
                    <li class="rbx-game-server-item col-md-3 col-sm-4 col-xs-6" data-gameid="${Instance.id}"><div class="card-item">
                        <div class="player-thumbnails-container">
                            <span class="avatar avatar-headshot-md player-avatar">
                                <span class="thumbnail-2d-container avatar-card-image">
                                    <img class="" src="${UserThumbnail}" alt="${TextEntered}" title="${TextEntered}">
                                </span>
                            </span>
                            ${ImagesHTML}
                            <span class="avatar avatar-headshot-md player-avatar hidden-players-placeholder">+${Instance.playing}</span>
                        </div>
                        <div class="rbx-game-server-details game-server-details">
                            <div class="text-info rbx-game-status rbx-game-server-status text-overflow">${Instance.playing} of ${Instance.maxPlayers} people max</div>
                            <div class="server-player-count-gauge border"><div class="gauge-inner-bar border" style="width: ${PercentageFull}%;">
                            </div>
                            </div>
                            <div class="text"><a class="text-name" href="https://www.roblox.com/users/${UserId}/profile">${TextEntered}</a> is in this server!</div>
                            <span data-placeid="${GameId}">
                                <button type="button" onclick="window.Roblox.GameLauncher.joinGameInstance(${GameId}, '${Instance.id}')" class="btn-full-width btn-control-xs rbx-game-server-join game-server-join-btn btn-primary-md btn-min-width">Join</button>
                            </span>
                        </div>
                    </div>
                    </li>
                `;

                MessageOnInputBox("Found server!");
            }
        });

        if (GameInstances.length - 1 == index) {
            Done = true;
        }
    }

    while (!Done);

    if (!Found) {
        MessageOnInputBox("User not found");
    }
}

function MessageOnInputBox(Message) {
    SearchInput.disabled = true;
    SearchButton.disabled = true;
    SearchInput.value = Message + " (3)";
    // count down from 3
    return setTimeout(() => {
        SearchInput.value = Message + " (2)";
        return setTimeout(() => {
            SearchInput.value = Message + " (1)";
            return setTimeout(() => {
                SearchInput.value = "";
                SearchInput.disabled = false;
                SearchButton.disabled = false;
                return
            }, 1000)
        }, 1000)
    }, 1000)
}