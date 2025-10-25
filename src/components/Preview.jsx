import SlantedPanel from "./SlantedPanel";
import { renderElement, getElementData } from "../utils/elementRenderer.jsx";
import "../styles/Customize.css";

function Preview({
  previewStep,
  enabledSteps,
  currentStep,
  previewData,
  previewConfig,
  youtubeData,
  onNextStep,
  onPrevStep,
}) {
  const renderPreviewStep = (step, previewData, config) => {
    if (!config || !step) return null;

    const colors = config.colors || {};
    const animation = step.element?.animation || "fadeIn";

    // Handle carousel items (individual list items)
    if (step.type === "carouselItem") {
      const item = step.item || {};
      const parentElement = step.element || {};
      return (
        <SlantedPanel
          emote={item.emote || parentElement.emote || "📋"}
          title={item.name || item.title || "Item"}
          colors={colors}
          animation={animation}
          isTransitioning={false}
          emoteSize={(item.emoteSize ?? parentElement.emoteSize) || 100}
          titleSize={item.titleSize ?? parentElement.titleSize}
          subtitleSize={item.subtitleSize ?? parentElement.subtitleSize}
          displayDuration={config?.rotationDuration || 5000}
          content={
            <div className="panel-single-command">
              <div
                className="panel-command-description"
                style={item.descriptionSize ? { fontSize: `${item.descriptionSize}px` } : undefined}
              >
                {item.description || item.text || ""}
              </div>
              {item.subtext && (
                <div
                  className="panel-command-subtext"
                  style={item.subtitleSize ? { fontSize: `${item.subtitleSize}px` } : undefined}
                >
                  {item.subtext}
                </div>
              )}
            </div>
          }
          subtitle={parentElement.fields?.subtext || ""}
        />
      );
    }

    // Handle regular elements
    const element = step.element;

    // Prepare data for this element
    const allData = {
      twitch: {
        followers: { current: previewData?.followers?.current ?? 0 },
        subscribers: { current: previewData?.subscribers?.current ?? 0 },
        vods: { text: previewData?.vod?.title ?? "", subtext: previewData?.vod?.date ?? "" },
      },
      youtube: youtubeData || {
        latest: { text: "Latest YouTube Video", subtext: "Preview mode", thumbnail: null },
      },
      custom: {
        donations: { value: previewData?.donations?.total ?? 0 },
      },
      config: config,
    };

    const elementData = getElementData(element, allData, config);
    const rendered = renderElement(element, elementData, colors);

    if (!rendered) return null;

    // If it's a carousel type, it should have been handled above
    if (rendered.type === "carousel") return null;

    return (
      <SlantedPanel
        emote={rendered.emote}
        title={rendered.title}
        colors={colors}
        animation={animation}
        isTransitioning={false}
        emoteSize={rendered.emoteSize || 100}
        titleSize={element?.titleSize}
        subtitleSize={element?.subtitleSize}
        displayDuration={config?.rotationDuration || 5000}
        content={rendered.content}
        subtitle={rendered.subtitle}
      />
    );
  };

  return (
    <div className="customize-preview">
      <div className="preview-label">
        Live Preview - Step {previewStep + 1} of {enabledSteps.length}
        {currentStep && currentStep.type === "carouselItem" && currentStep.item && (
          <span className="preview-command-label">
            {" "}
            - Item: {currentStep.item.name || currentStep.item.title || "Item"}
          </span>
        )}
        {currentStep && currentStep.type === "element" && currentStep.element && (
          <span className="preview-command-label"> - {currentStep.element.title || currentStep.element.id}</span>
        )}
      </div>
      <div className="preview-controls">
        <button onClick={onPrevStep} className="preview-nav-btn">
          ← Previous
        </button>
        <button onClick={onNextStep} className="preview-nav-btn">
          Next →
        </button>
      </div>
      <div className="preview-container">
        {currentStep && renderPreviewStep(currentStep, previewData, previewConfig)}
      </div>
    </div>
  );
}

export default Preview;
