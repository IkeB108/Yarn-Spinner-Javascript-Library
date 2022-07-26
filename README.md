# Yarn Spinner Javascript Library
An easy way to integrate dialogue trees created with [Yarn Spinner](https://yarnspinnertool.github.io/YarnEditor/) into your Javascript project.

This library parses all the bodies of your nodes and returns an object containing all the nodes in a much more useful format. It also allows you to do more with the Yarn Spinner Editor than its creators intended.
## How to Use
1. Add the script to your project's HTML file: `<script type="text/javascript" src="yarnSpinner.js"></script>`
2. In the Yarn Spinner editor, click File -> Save as JSON
3. Once the JSON object is in your Javascript project, create an instance of DialogueTree:

```myDialogue = new DialogueTree( some_json_object )```

4. Poke around to see what your new dialogue tree object looks like

## Features you can use in the Yarn Spinner editor
All of these features are optional.

![exampleNode](https://user-images.githubusercontent.com/56776763/180628070-ee2ef5bc-053d-4222-a1c8-821f49d644e1.PNG)

- Add Javascript commands to the body of your node with angle brackets: `<< command here >>`
  - The command will be executed with `eval` when the node is made active by either `setActiveNode()` or `followLink()`
- Add conditions to links by putting them after the link: `[[myLink]]<< playerCoins >= 10 >>`
  - If any links have a condition that's not met, they won't appear in the node's `displayLinks` array (this way, you can hide them from the user if you choose)
  - Conditional must be immediately after the link, on the same line
  - The conditional is evaluated with `eval`
- Add tags to links using curly brackets: `[[myLink]]{{tagForLink}}`
  - The tag will be added to the link object's `tags` array
  - The `{{alwaysDisplay}}` tag will make the link always appear in the node's `displayLinks` array even if its condition is not met
- String interpolation: expressions within `${}` are evaluated in the body text.

## Properties
Your DialogueTree object comes with useful properties:
- `name`: The name of the dialogue tree (can be changed manually; default is the title of the first node)
- `nodes`: An object containing all the nodes in your dialogue tree. Each node has the following properties:
  - `title`: Title of the node
  - `tags`: A string containing all the tags of the node
  - `originalBody`: The body text of the node exactly as it appeared in the Yarn Spinner editor
  - `rawBody`: The body text is parsed, except for any uses of `${}`
  - `body`: A getter function. Returns the parsed body text as it should be displayed to the user, with all uses of `${}` evaluated using `eval`.
  - `links`: An array of all the link objects in the node.
  - `displayLinks`: A getter function. Returns an array containing only the links that satisfy one of the following:
    - The link's condition is met
    - The link does not have a condition
    - The link is tagged `{{alwaysDisplay}}`
  - `commands`: An array storing all the Javascript commands written in the body
  - `executeCommands`: a function which executes any Javascript commands in the body of the node using `eval`
    - NOTE: Commands are executed automatically when calling the `setActiveNode` or `followLink` methods. `executeCommands` should not be needed most of the time.
  - `colorID` and `position`: Extra info from Yarn Spinner which is likely not relevant once your dialogue is exported.
- `activeNode`: The node which is currently set to active.
  - NOTE: This should not be set manually. Instead, call `setActiveNode()` or `followLink()` (see below)
- `nodeHistory`: An array of node indeces from `nodes`. Lists previously active nodes in the order they were made active
- `originalJSON`: The JSON object which was exported from Yarn Spinner.



## Methods
#### setActiveNode
```javascript
myDialogue.setActiveNode( nodeTitle, [ignoreCommands] )
```
Sets the `activeNode` property to the node with the given title.
- `nodeTitle`: Title of the node (string) or index of the node in `nodes`
- `ignoreCommands`: Optional Boolean. When true, any Javascript commands in the body of the new node will not be executed. Default is false.
#### followLink
```javascript
myDialogue.followLink( linkIndex, [displayLinksOnly], [ignoreCommands] )
```
Follows the nth link in the list of links from the active node, where n is `linkIndex`.
- `linkIndex`: Number: Index of the link to follow (or a string: the display text of the link to follow)
- `displayLinksOnly`: Optional Boolean. When true, this method will follow the linkIndex at the node's `displayLinks` array instead of its `links` array (recommended). Default is false.
- `ignoreCommands`: Optional Boolean. When true, any Javascript commands in the body of the new node will not be executed. Default is false.
#### getNode
```javascript
myDialogue.getNode( nodeTitle )
```
Returns the node that has the given title.
- `nodeTitle`: String. The title (or index) of the node you wish to retrieve
#### getNodeIndex
```javascript
myDialogue.getNodeIndex( nodeTitle )
```
Returns the index of the node that has the given title in the `nodes` array
- `nodeTitle`: String. The title of the node you wish to retrieve
#### getNodesByTag
```javascript
myDialogue.getNodesByTag( nodeTag, [returnIndex] )
```
Returns an array of nodes that include the provided tag.
- `nodeTag`: String. The name of the tag to search for.
- `returnIndex`: Optional Boolean. When true, returns the nodes' indeces instead of the nodes themselves
